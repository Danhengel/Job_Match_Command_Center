from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.automation import AutomationRun, Notification, SavedSearch
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.recruiting import InterviewEvent
from app.models.resume import Resume
from app.services import job_sources
from app.services.job_matcher import match_job


def _unread_notification_exists(
    db: Session,
    user_id: int,
    kind: str,
    metadata_key: str,
    metadata_value: Any,
    window_key: str | None = None,
    window_value: Any | None = None,
) -> bool:
    candidates = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.kind == kind,
        Notification.read.is_(False),
    ).all()
    for item in candidates:
        metadata = item.metadata_json or {}
        if metadata.get(metadata_key) != metadata_value:
            continue
        if window_key and metadata.get(window_key) != window_value:
            continue
        return True
    return False


def notification_exists(
    db: Session,
    user_id: int,
    kind: str,
    metadata_key: str,
    metadata_value: Any,
) -> bool:
    candidates = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.kind == kind,
    ).all()
    return any(
        (item.metadata_json or {}).get(metadata_key) == metadata_value
        for item in candidates
    )


def run_saved_search(
    db: Session,
    saved_search: SavedSearch,
    notify: bool = True,
) -> dict:
    started = datetime.utcnow()
    profile = db.query(CareerProfile).filter(
        CareerProfile.id == saved_search.profile_id,
        CareerProfile.user_id == saved_search.user_id,
    ).first()
    if not profile:
        raise ValueError("Profile not found")

    primary = db.query(Resume).filter(
        Resume.profile_id == profile.id,
        Resume.is_primary.is_(True),
    ).first()
    resume_text = primary.extracted_text if primary else ""
    rows: list[dict] = []
    errors: list[str] = []
    coverage_notes: list[str] = []

    if saved_search.use_remotive:
        for title in saved_search.titles or []:
            try:
                batch = job_sources.remotive(title)
                rows += batch
                if not batch:
                    coverage_notes.append(
                        f"Remotive returned no jobs for '{title}'."
                    )
            except Exception as exc:
                errors.append(
                    f"Remotive {title}: "
                    f"{job_sources.source_error_message(exc)}"
                )

    if saved_search.use_catalog:
        catalog = job_sources.employer_catalog()
        board_groups = [
            (
                "Greenhouse",
                job_sources.greenhouse,
                catalog.get("greenhouse", []),
            ),
            (
                "Lever",
                job_sources.lever,
                catalog.get("lever", []),
            ),
            (
                "Ashby",
                job_sources.ashby,
                catalog.get("ashby", []),
            ),
        ]
        for label, loader, boards in board_groups:
            for item in boards:
                board = item.get("board", "")
                if not board:
                    continue
                try:
                    batch = loader(board)
                    rows += batch
                    if not batch:
                        coverage_notes.append(
                            f"{label} board '{board}' returned no open jobs."
                        )
                except Exception as exc:
                    errors.append(
                        f"{label} {board}: "
                        f"{job_sources.source_error_message(exc)}"
                    )

    if saved_search.use_jsearch:
        for title in saved_search.titles or []:
            query = f"{title} in {saved_search.location}"
            try:
                batch = job_sources.jsearch(query)
                rows += batch
                if not batch:
                    coverage_notes.append(
                        f"JSearch returned no jobs for '{query}'."
                    )
            except Exception as exc:
                errors.append(
                    f"JSearch {title}: "
                    f"{job_sources.source_error_message(exc)}"
                )

    unique_rows = job_sources.dedupe(rows)
    source_counts = dict(
        sorted(
            Counter(
                row.get("source") or "Unknown"
                for row in rows
            ).items(),
            key=lambda item: (-item[1], item[0].lower()),
        )
    )
    new_job_count = 0
    matched_count = 0
    high_matches: list[tuple[Job, int]] = []

    for row in unique_rows:
        job = db.query(Job).filter(
            Job.provider_key == row["provider_key"]
        ).first()
        if not job:
            job = Job(**row)
            db.add(job)
            db.flush()
            new_job_count += 1
        else:
            for key, value in row.items():
                setattr(job, key, value)
            job.last_seen = datetime.utcnow()
            job.active = True

        scored = match_job(job, profile, resume_text)
        if scored["score"] < saved_search.minimum_score:
            continue
        matched_count += 1
        match = db.query(JobMatch).filter(
            JobMatch.profile_id == profile.id,
            JobMatch.job_id == job.id,
        ).first()
        if not match:
            match = JobMatch(
                profile_id=profile.id,
                job_id=job.id,
                **scored,
            )
            db.add(match)
        else:
            for key, value in scored.items():
                setattr(match, key, value)
        if scored["score"] >= max(
            70,
            saved_search.minimum_score,
        ):
            high_matches.append((job, scored["score"]))

    saved_search.last_run_at = datetime.utcnow()
    saved_search.last_result_count = matched_count
    db.add(
        AutomationRun(
            saved_search_id=saved_search.id,
            status=(
                "completed"
                if not errors
                else "completed_with_errors"
            ),
            new_job_count=new_job_count,
            matched_job_count=matched_count,
            errors=errors,
            started_at=started,
            finished_at=datetime.utcnow(),
        )
    )

    if (
        notify
        and matched_count
        and not _unread_notification_exists(
            db,
            saved_search.user_id,
            "saved_search",
            "saved_search_id",
            saved_search.id,
        )
    ):
        publisher_count = len(source_counts)
        db.add(
            Notification(
                user_id=saved_search.user_id,
                kind="saved_search",
                title=f"{matched_count} search matches",
                message=(
                    f"{matched_count} jobs matched "
                    f"'{saved_search.name}'. "
                    f"{new_job_count} were new and "
                    f"{publisher_count} publishers were represented."
                ),
                link="/jobs",
                metadata_json={
                    "saved_search_id": saved_search.id,
                    "matched_count": matched_count,
                    "new_job_count": new_job_count,
                    "publisher_count": publisher_count,
                    "source_counts": source_counts,
                },
            )
        )

    if notify:
        for job, score in high_matches[:5]:
            if _unread_notification_exists(
                db,
                saved_search.user_id,
                "high_match",
                "job_id",
                job.id,
            ):
                continue
            db.add(
                Notification(
                    user_id=saved_search.user_id,
                    kind="high_match",
                    title=f"{score}% match: {job.title}",
                    message=f"{job.company} · {job.location}",
                    link=(
                        f"/jobs/{job.id}"
                        f"?profile_id={profile.id}"
                    ),
                    metadata_json={
                        "job_id": job.id,
                        "profile_id": profile.id,
                        "score": score,
                        "source": job.source,
                    },
                )
            )

    db.commit()
    return {
        "saved_search_id": saved_search.id,
        "new_job_count": new_job_count,
        "matched_job_count": matched_count,
        "source_counts": source_counts,
        "coverage_notes": coverage_notes,
        "errors": errors,
    }


def generate_follow_up_notifications(
    db: Session,
    user_id: int,
    follow_up_days: int = 7,
    enabled: bool = True,
) -> int:
    if not enabled:
        return 0
    now = datetime.utcnow()
    count = 0
    apps = db.query(Application).filter(
        Application.user_id == user_id
    ).all()
    for app in apps:
        follow_up_at = (
            getattr(app, "next_action_at", None)
            or getattr(app, "follow_up_at", None)
        )
        due = bool(follow_up_at and follow_up_at <= now)
        if (
            not due
            and app.applied_at
            and app.status == "applied"
        ):
            due = (
                app.applied_at
                <= now - timedelta(days=follow_up_days)
            )
        if (
            not due
            or _unread_notification_exists(
                db,
                user_id,
                "follow_up",
                "application_id",
                app.id,
            )
        ):
            continue
        db.add(
            Notification(
                user_id=user_id,
                kind="follow_up",
                title="Application follow-up due",
                message=(
                    app.next_action
                    or "Follow up on this application."
                ),
                link=f"/applications/{app.id}",
                metadata_json={
                    "application_id": app.id,
                },
            )
        )
        count += 1
    db.commit()
    return count


def generate_interview_notifications(
    db: Session,
    user_id: int,
    reminder_hours: list[int] | None = None,
    enabled: bool = True,
) -> int:
    if not enabled:
        return 0
    windows = sorted(
        {
            int(value)
            for value in (reminder_hours or [48, 24])
            if int(value) > 0
        },
        reverse=True,
    )
    if not windows:
        return 0
    now = datetime.utcnow()
    upper_bound = now + timedelta(hours=max(windows))
    count = 0
    events = (
        db.query(InterviewEvent)
        .filter(
            InterviewEvent.user_id == user_id,
            InterviewEvent.completed.is_(False),
            InterviewEvent.starts_at >= now,
            InterviewEvent.starts_at <= upper_bound,
        )
        .order_by(InterviewEvent.starts_at.asc())
        .all()
    )

    for event in events:
        hours_until = max(
            0,
            int(
                (event.starts_at - now).total_seconds()
                // 3600
            ),
        )
        eligible = [
            hours
            for hours in windows
            if event.starts_at
            <= now + timedelta(hours=hours)
        ]
        if not eligible:
            continue
        window_hours = min(eligible)
        window = f"{window_hours}h"
        if _unread_notification_exists(
            db,
            user_id,
            "interview_reminder",
            "interview_event_id",
            event.id,
            "window",
            window,
        ):
            continue
        db.add(
            Notification(
                user_id=user_id,
                kind="interview_reminder",
                title=(
                    f"{event.title} is within "
                    f"{window_hours} hours"
                ),
                message=(
                    f"Your {event.event_type} begins in about "
                    f"{hours_until} hours. Review the application, "
                    "practice key answers, and confirm meeting details."
                ),
                link=f"/applications/{event.application_id}",
                metadata_json={
                    "interview_event_id": event.id,
                    "application_id": event.application_id,
                    "window": window,
                },
            )
        )
        count += 1
    db.commit()
    return count


def refresh_smart_notifications(
    db: Session,
    user_id: int,
    follow_up_days: int = 7,
    interview_reminder_hours: list[int] | None = None,
    categories: dict | None = None,
) -> dict:
    categories = categories or {
        "applications": True,
        "interviews": True,
    }
    return {
        "follow_ups_created": generate_follow_up_notifications(
            db,
            user_id,
            follow_up_days,
            bool(categories.get("applications", True)),
        ),
        "interview_reminders_created": (
            generate_interview_notifications(
                db,
                user_id,
                interview_reminder_hours,
                bool(categories.get("interviews", True)),
            )
        ),
    }


def build_daily_digest(db: Session, user_id: int) -> dict:
    refresh_smart_notifications(db, user_id)
    unread = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read.is_(False),
    ).all()
    counts: dict[str, int] = {}
    for item in unread:
        counts[item.kind] = counts.get(item.kind, 0) + 1
    return {
        "unread_count": len(unread),
        "high_matches": counts.get("high_match", 0),
        "saved_search_updates": counts.get("saved_search", 0),
        "follow_ups_due": counts.get("follow_up", 0),
        "interview_reminders": counts.get(
            "interview_reminder",
            0,
        ),
        "items": [
            {
                "id": notification.id,
                "kind": notification.kind,
                "title": notification.title,
                "message": notification.message,
                "link": notification.link,
                "created_at": notification.created_at.isoformat(),
            }
            for notification in sorted(
                unread,
                key=lambda item: item.created_at,
                reverse=True,
            )[:20]
        ],
    }
