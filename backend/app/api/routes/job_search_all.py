from __future__ import annotations

import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes import jobs as base_jobs
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.job import Job, JobMatch, SearchRun
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.user import User
from app.schemas.jobs import JobSearchRequest
from app.services import external_job_sources
from app.services.job_matcher import match_job


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
MAX_EXTERNAL_TITLES = 8
MAX_EXTERNAL_WORKERS = 6


def normalized_job_key(company: str, title: str, location: str) -> str:
    return re.sub(
        r"\W+",
        " ",
        f"{company}|{title}|{location}".lower(),
    ).strip()


def capability_note(source: str) -> str:
    notes = {
        "USAJOBS": (
            "USAJOBS connector is installed but inactive until "
            "USAJOBS_API_KEY and USAJOBS_EMAIL are configured."
        ),
        "Adzuna": (
            "Adzuna connector is installed but inactive until "
            "ADZUNA_APP_ID and ADZUNA_APP_KEY are configured."
        ),
        "Jooble": (
            "Jooble connector is installed but inactive until "
            "JOOBLE_API_KEY is configured."
        ),
    }
    return notes[source]


@router.post("/search-all")
def search_all(
    body: JobSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = base_jobs.search(body=body, user=user, db=db)

    profile = (
        db.query(CareerProfile)
        .filter(
            CareerProfile.id == body.profile_id,
            CareerProfile.user_id == user.id,
        )
        .first()
    )
    primary_resume = (
        db.query(Resume)
        .filter(
            Resume.profile_id == body.profile_id,
            Resume.is_primary.is_(True),
        )
        .first()
    )
    resume_text = primary_resume.extracted_text if primary_resume else ""

    capabilities = external_job_sources.connector_capabilities()
    source_specs = [
        (
            "USAJOBS",
            capabilities["usajobs"],
            external_job_sources.usajobs,
        ),
        (
            "Adzuna",
            capabilities["adzuna"],
            external_job_sources.adzuna,
        ),
        (
            "Jooble",
            capabilities["jooble"],
            external_job_sources.jooble,
        ),
    ]

    query_titles = list(
        dict.fromkeys(
            [
                *(title.strip() for title in body.titles if title.strip()),
                *(
                    title.strip()
                    for title in base.get("expanded_titles", [])
                    if title.strip()
                ),
            ]
        )
    )[:MAX_EXTERNAL_TITLES]

    rows: list[dict] = []
    searched_sources = list(base.get("searched_sources") or [])
    source_status = list(base.get("source_status") or [])
    coverage_notes = list(base.get("coverage_notes") or [])
    errors = list(base.get("errors") or [])

    source_totals = {
        name: {"jobs": 0, "failures": 0, "requests": 0}
        for name, configured, _loader in source_specs
        if configured
    }

    futures = {}
    with ThreadPoolExecutor(max_workers=MAX_EXTERNAL_WORKERS) as executor:
        for source_name, configured, loader in source_specs:
            if not configured:
                coverage_notes.append(capability_note(source_name))
                continue

            searched_sources.append(source_name)
            for title in query_titles:
                source_totals[source_name]["requests"] += 1
                future = executor.submit(
                    loader,
                    title,
                    body.jsearch_location,
                )
                futures[future] = (source_name, title)

        for future in as_completed(futures):
            source_name, title = futures[future]
            try:
                batch = future.result()
                rows.extend(batch)
                source_totals[source_name]["jobs"] += len(batch)
                if not batch:
                    coverage_notes.append(
                        f"{source_name} returned no jobs for '{title}'."
                    )
            except Exception as exc:
                source_totals[source_name]["failures"] += 1
                errors.append(f"{source_name} {title}: {exc}")

    for source_name, totals in source_totals.items():
        source_status.append(
            base_jobs.source_status_item(
                source_name,
                totals["jobs"],
                totals["failures"],
                totals["requests"],
            )
        )

    external_rows = external_job_sources.dedupe(rows)
    results = list(base.get("results") or [])
    existing_result_keys = {
        normalized_job_key(
            item.get("job", {}).get("company", ""),
            item.get("job", {}).get("title", ""),
            item.get("job", {}).get("location", ""),
        )
        for item in results
    }
    external_unique_keys = set()

    if profile:
        for row in external_rows:
            result_key = normalized_job_key(
                row.get("company", ""),
                row.get("title", ""),
                row.get("location", ""),
            )
            external_unique_keys.add(result_key)

            job = (
                db.query(Job)
                .filter(Job.provider_key == row["provider_key"])
                .first()
            )
            if not job:
                job = Job(**row)
                db.add(job)
                db.flush()
            else:
                for key, value in row.items():
                    setattr(job, key, value)
                job.last_seen = datetime.utcnow()
                job.active = True

            scored = match_job(job, profile, resume_text)
            if scored["score"] < body.minimum_score:
                continue

            match = (
                db.query(JobMatch)
                .filter(
                    JobMatch.profile_id == profile.id,
                    JobMatch.job_id == job.id,
                )
                .first()
            )
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

            if result_key not in existing_result_keys:
                results.append(base_jobs.serialize_job(job, match))
                existing_result_keys.add(result_key)

    results.sort(
        key=lambda item: item.get("match", {}).get("score", 0),
        reverse=True,
    )

    source_counts = Counter(base.get("source_counts") or {})
    source_counts.update(
        row.get("source") or "Unknown"
        for row in rows
    )

    base_unique_count = int(base.get("unique_jobs") or 0)
    overlap_count = sum(
        key in existing_result_keys
        for key in external_unique_keys
    )
    additional_unique = max(0, len(external_unique_keys) - overlap_count)

    base.update(
        {
            "results": results,
            "errors": errors,
            "coverage_notes": list(dict.fromkeys(coverage_notes)),
            "searched_sources": list(dict.fromkeys(searched_sources)),
            "source_counts": dict(
                sorted(
                    source_counts.items(),
                    key=lambda item: (-item[1], item[0].lower()),
                )
            ),
            "source_status": source_status,
            "searched": int(base.get("searched") or 0) + len(rows),
            "unique_jobs": base_unique_count + additional_unique,
            "connector_setup": capabilities,
            "external_titles_searched": query_titles,
        }
    )

    search_run_id = base.get("search_run_id")
    if search_run_id:
        search_run = (
            db.query(SearchRun)
            .filter(
                SearchRun.id == search_run_id,
                SearchRun.user_id == user.id,
            )
            .first()
        )
        if search_run:
            search_run.searched_sources = base["searched_sources"]
            search_run.raw_count = base["searched"]
            search_run.unique_count = base["unique_jobs"]
            search_run.matched_count = len(results)
            search_run.errors = errors
            search_run.source_counts = base["source_counts"]
            search_run.source_status = source_status
            search_run.coverage_notes = base["coverage_notes"]

    db.commit()
    return base
