from __future__ import annotations
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.automation import AutomationRun, Notification, SavedSearch
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.services import job_sources
from app.services.job_matcher import match_job


def run_saved_search(db: Session, saved_search: SavedSearch) -> dict:
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

    rows = []
    errors = []

    if saved_search.use_remotive:
        for title in saved_search.titles or []:
            try:
                rows += job_sources.remotive(title)
            except Exception as exc:
                errors.append(f"Remotive {title}: {exc}")

    if saved_search.use_jsearch:
        for title in saved_search.titles or []:
            try:
                rows += job_sources.jsearch(
                    f"{title} in {saved_search.location}"
                )
            except Exception as exc:
                errors.append(f"JSearch {title}: {exc}")

    unique_rows = job_sources.dedupe(rows)
    new_job_count = 0
    matched_count = 0
    high_matches = []

    for row in unique_rows:
        job = db.query(Job).filter(Job.provider_key == row["provider_key"]).first()
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

        if scored["score"] >= max(70, saved_search.minimum_score):
            high_matches.append((job, scored["score"]))

    saved_search.last_run_at = datetime.utcnow()
    saved_search.last_result_count = matched_count

    run = AutomationRun(
        saved_search_id=saved_search.id,
        status="completed" if not errors else "completed_with_errors",
        new_job_count=new_job_count,
        matched_job_count=matched_count,
        errors=errors,
        started_at=started,
        finished_at=datetime.utcnow(),
    )
    db.add(run)

    if matched_count:
        message = (
            f"{matched_count} jobs matched '{saved_search.name}'. "
            f"{new_job_count} were new to your database."
        )
        db.add(Notification(
            user_id=saved_search.user_id,
            kind="saved_search",
            title=f"{matched_count} new matches",
            message=message,
            link="/jobs",
            metadata_json={
                "saved_search_id": saved_search.id,
                "matched_count": matched_count,
                "new_job_count": new_job_count,
            },
        ))

    for job, score in high_matches[:5]:
        db.add(Notification(
            user_id=saved_search.user_id,
            kind="high_match",
            title=f"{score}% match: {job.title}",
            message=f"{job.company} · {job.location}",
            link=f"/jobs/{job.id}?profile_id={profile.id}",
            metadata_json={
                "job_id": job.id,
                "profile_id": profile.id,
                "score": score,
            },
        ))

    db.commit()

    return {
        "saved_search_id": saved_search.id,
        "new_job_count": new_job_count,
        "matched_job_count": matched_count,
        "errors": errors,
    }


def generate_follow_up_notifications(db: Session, user_id: int) -> int:
    now = datetime.utcnow()
    count = 0
    apps = db.query(Application).filter(
        Application.user_id == user_id
    ).all()

    for app in apps:
        due = False
        if app.follow_up_at and app.follow_up_at <= now:
            due = True
        elif app.applied_at and app.status == "applied":
            due = app.applied_at <= now - timedelta(days=7)

        if not due:
            continue

        existing_candidates = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.kind == "follow_up",
            Notification.read.is_(False),
        ).all()
        existing = next(
            (
                item
                for item in existing_candidates
                if (item.metadata_json or {}).get("application_id") == app.id
            ),
            None,
        )

        if existing:
            continue

        db.add(Notification(
            user_id=user_id,
            kind="follow_up",
            title="Application follow-up due",
            message=app.next_action or "Follow up on this application.",
            link=f"/applications/{app.id}",
            metadata_json={"application_id": app.id},
        ))
        count += 1

    db.commit()
    return count


def build_daily_digest(db: Session, user_id: int) -> dict:
    generate_follow_up_notifications(db, user_id)

    unread = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read.is_(False),
    ).all()

    counts = {}
    for item in unread:
        counts[item.kind] = counts.get(item.kind, 0) + 1

    return {
        "unread_count": len(unread),
        "high_matches": counts.get("high_match", 0),
        "saved_search_updates": counts.get("saved_search", 0),
        "follow_ups_due": counts.get("follow_up", 0),
        "items": [
            {
                "id": n.id,
                "kind": n.kind,
                "title": n.title,
                "message": n.message,
                "link": n.link,
                "created_at": n.created_at.isoformat(),
            }
            for n in sorted(unread, key=lambda x: x.created_at, reverse=True)[:20]
        ],
    }
