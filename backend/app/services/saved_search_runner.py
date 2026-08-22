from __future__ import annotations

from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, Callable

from sqlalchemy.orm import Session

from app.models.automation import AutomationRun, Notification, SavedSearch
from app.models.enterprise import CareerPageWatch
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.services import (
    careeronestop_source,
    external_job_sources,
    job_sources,
    jobspipe_source,
    web_discovery,
)
from app.services.job_matcher import match_job


MAX_TITLES = 18
MAX_WORKERS = 10
BROAD_JOBSPIPE_LIMIT = 50
MAJOR_BOARD_LIMIT = 5
EXPANDED_BOARD_LIMIT = 25


def _unread_notification_exists(
    db: Session,
    user_id: int,
    kind: str,
    metadata_key: str,
    metadata_value: Any,
) -> bool:
    candidates = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.kind == kind,
        Notification.read.is_(False),
    ).all()
    return any(
        (item.metadata_json or {}).get(metadata_key) == metadata_value
        for item in candidates
    )


def _source_status(source: str, jobs: int, failures: int, requests: int) -> dict:
    if jobs and failures:
        status = "partial"
    elif jobs:
        status = "success"
    elif failures:
        status = "failed"
    else:
        status = "empty"
    return {
        "source": source,
        "status": status,
        "jobs": jobs,
        "failures": failures,
        "requests": requests,
    }


def _matches_titles(row: dict, titles: list[str]) -> bool:
    title_row = {"title": row.get("title", "")}
    return not titles or any(
        job_sources.query_matches(title_row, title) for title in titles
    )


def _catalog_tasks() -> list[tuple[str, Callable, tuple, bool, CareerPageWatch | None]]:
    catalog = job_sources.employer_catalog()
    specs = (
        ("Greenhouse", job_sources.greenhouse, catalog.get("greenhouse", [])),
        ("Lever", job_sources.lever, catalog.get("lever", [])),
        ("Ashby", job_sources.ashby, catalog.get("ashby", [])),
        ("SmartRecruiters", job_sources.smartrecruiters, catalog.get("smartrecruiters", [])),
        ("Recruitee", job_sources.recruitee, catalog.get("recruitee", [])),
        ("Workable", job_sources.workable, catalog.get("workable", [])),
    )
    tasks = []
    for source, loader, items in specs:
        for item in items:
            board = item.get("board", "") if isinstance(item, dict) else str(item or "")
            if board:
                tasks.append((f"{source} employer catalog", loader, (board,), True, None))
    return tasks


def _watch_tasks(
    watches: list[CareerPageWatch],
) -> list[tuple[str, Callable, tuple, bool, CareerPageWatch | None]]:
    direct_loaders = {
        "greenhouse": job_sources.greenhouse,
        "lever": job_sources.lever,
        "ashby": job_sources.ashby,
        "smartrecruiters": job_sources.smartrecruiters,
        "recruitee": job_sources.recruitee,
        "workable": job_sources.workable,
    }
    tasks = []
    for watch in watches:
        ats_type = (watch.ats_type or "unknown").strip().lower()
        value = (watch.board_identifier or "").strip() or watch.career_url
        loader = direct_loaders.get(ats_type)
        if loader:
            tasks.append((f"Saved {ats_type} career pages", loader, (value,), True, watch))
        else:
            tasks.append(
                (
                    "Saved career pages",
                    web_discovery.fetch_jobposting_rows,
                    (watch.career_url,),
                    True,
                    watch,
                )
            )
    return tasks


def collect_saved_search_rows(
    saved_search: SavedSearch,
    watches: list[CareerPageWatch] | None = None,
) -> dict:
    from app.api.routes.jobs import (
        expand_search_titles,
        prioritized_search_titles,
        split_search_locations,
    )

    requested_titles = list(
        dict.fromkeys(
            title.strip()
            for title in (saved_search.titles or [])
            if title and title.strip()
        )
    )
    titles = prioritized_search_titles(
        requested_titles,
        expand_search_titles(requested_titles),
        limit=MAX_TITLES,
    )
    location = (saved_search.location or "United States").strip()
    search_locations = split_search_locations(location)
    tasks: list[tuple[str, Callable, tuple, bool, CareerPageWatch | None]] = []
    coverage_notes: list[str] = []

    remote_sources = (
        ("Remotive", job_sources.remotive),
        ("Remote OK", job_sources.remoteok),
        ("Jobicy", job_sources.jobicy),
    )
    if saved_search.use_remotive:
        for source, loader in remote_sources:
            for title in titles:
                tasks.append((source, loader, (title,), False, None))

    if saved_search.use_catalog:
        tasks.extend(_catalog_tasks())

    if saved_search.use_jsearch:
        for title in titles:
            for search_location in search_locations:
                tasks.append(
                    (
                        "JSearch / Google Jobs publishers",
                        job_sources.jsearch,
                        (f"{title} in {search_location}",),
                        False,
                        None,
                    )
                )

    if jobspipe_source.configured():
        tasks.append(
            (
                "JobsPipe broad coverage",
                jobspipe_source.jobs,
                (titles, location, None, BROAD_JOBSPIPE_LIMIT),
                False,
                None,
            )
        )
        for source_key, label in jobspipe_source.MAJOR_BOARD_SOURCES.items():
            tasks.append(
                (
                    f"JobsPipe / {label}",
                    jobspipe_source.jobs,
                    (titles, location, [source_key], MAJOR_BOARD_LIMIT),
                    False,
                    None,
                )
            )
        tasks.append(
            (
                "JobsPipe / expanded major boards",
                jobspipe_source.jobs,
                (
                    titles,
                    location,
                    list(jobspipe_source.EXPANDED_BOARD_SOURCES),
                    EXPANDED_BOARD_LIMIT,
                ),
                False,
                None,
            )
        )
    else:
        coverage_notes.append("JobsPipe is not configured for automated searches.")

    external_capabilities = external_job_sources.connector_capabilities()
    external_specs = (
        ("USAJOBS", "usajobs", external_job_sources.usajobs),
        ("Adzuna", "adzuna", external_job_sources.adzuna),
        ("Jooble", "jooble", external_job_sources.jooble),
    )
    for source, key, loader in external_specs:
        if external_capabilities.get(key):
            for title in titles:
                tasks.append((source, loader, (title, location), False, None))
        else:
            coverage_notes.append(f"{source} is not configured for automated searches.")

    if careeronestop_source.configured():
        for title in titles:
            tasks.append(
                (
                    "CareerOneStop / NLx",
                    careeronestop_source.jobs,
                    (title, location),
                    False,
                    None,
                )
            )
    else:
        coverage_notes.append(
            "CareerOneStop / NLx is not configured for automated searches."
        )

    if web_discovery.connector_capabilities().get("brave"):
        for title in titles:
            tasks.append(("Brave web discovery", web_discovery.brave_jobs, (title, location), False, None))
    else:
        coverage_notes.append("Brave web discovery is not configured for automated searches.")

    active_watches = [watch for watch in (watches or []) if watch.active]
    tasks.extend(_watch_tasks(active_watches))

    rows: list[dict] = []
    errors: list[str] = []
    totals: dict[str, dict[str, int]] = {}
    for source, _loader, _args, _filter_titles, _watch in tasks:
        totals.setdefault(source, {"jobs": 0, "failures": 0, "requests": 0})
        totals[source]["requests"] += 1

    futures = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for source, loader, args, filter_titles, watch in tasks:
            future = executor.submit(loader, *args)
            futures[future] = (source, args, filter_titles, watch)

        for future in as_completed(futures):
            source, args, filter_titles, watch = futures[future]
            try:
                batch = future.result() or []
                if filter_titles:
                    batch = [
                        row
                        for row in batch
                        if _matches_titles(row, requested_titles)
                    ]
                rows.extend(batch)
                totals[source]["jobs"] += len(batch)
                if watch is not None:
                    watch.last_checked_at = datetime.utcnow()
                    watch.last_job_count = len(batch)
                    watch.last_error = ""
                if not batch:
                    coverage_notes.append(
                        f"{source} returned no matching jobs for {args[0]!r}."
                    )
            except Exception as exc:
                totals[source]["failures"] += 1
                safe_error = job_sources.source_error_message(exc)
                errors.append(f"{source} {args[0]!r}: {safe_error}")
                if watch is not None:
                    watch.last_checked_at = datetime.utcnow()
                    watch.last_job_count = 0
                    watch.last_error = safe_error

    return {
        "rows": job_sources.dedupe(rows),
        "raw_count": len(rows),
        "errors": errors,
        "coverage_notes": list(dict.fromkeys(coverage_notes)),
        "searched_sources": list(totals),
        "source_status": [
            _source_status(source, values["jobs"], values["failures"], values["requests"])
            for source, values in totals.items()
        ],
    }


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
    watches = db.query(CareerPageWatch).filter(
        CareerPageWatch.user_id == saved_search.user_id,
        CareerPageWatch.active.is_(True),
    ).all()
    collection = collect_saved_search_rows(saved_search, watches)
    unique_rows = collection["rows"]
    source_counts = dict(
        sorted(
            Counter(row.get("source") or "Unknown" for row in unique_rows).items(),
            key=lambda item: (-item[1], item[0].lower()),
        )
    )
    new_job_count = 0
    matched_count = 0
    high_matches: list[tuple[Job, int]] = []

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
            match = JobMatch(profile_id=profile.id, job_id=job.id, **scored)
            db.add(match)
        else:
            for key, value in scored.items():
                setattr(match, key, value)
        if scored["score"] >= max(70, saved_search.minimum_score):
            high_matches.append((job, scored["score"]))

    saved_search.last_run_at = datetime.utcnow()
    saved_search.last_result_count = matched_count
    db.add(
        AutomationRun(
            saved_search_id=saved_search.id,
            status="completed" if not collection["errors"] else "completed_with_errors",
            new_job_count=new_job_count,
            matched_job_count=matched_count,
            errors=collection["errors"],
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
        db.add(
            Notification(
                user_id=saved_search.user_id,
                kind="saved_search",
                title=f"{matched_count} search matches",
                message=(
                    f"{matched_count} jobs matched '{saved_search.name}'. "
                    f"{new_job_count} were new and {len(source_counts)} publishers were represented."
                ),
                link="/jobs",
                metadata_json={
                    "saved_search_id": saved_search.id,
                    "matched_count": matched_count,
                    "new_job_count": new_job_count,
                    "publisher_count": len(source_counts),
                    "source_counts": source_counts,
                    "searched_sources": collection["searched_sources"],
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
                    link=f"/jobs/{job.id}?profile_id={profile.id}",
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
        "raw_count": collection["raw_count"],
        "unique_job_count": len(unique_rows),
        "new_job_count": new_job_count,
        "matched_job_count": matched_count,
        "source_counts": source_counts,
        "searched_sources": collection["searched_sources"],
        "source_status": collection["source_status"],
        "coverage_notes": collection["coverage_notes"],
        "errors": collection["errors"],
    }
