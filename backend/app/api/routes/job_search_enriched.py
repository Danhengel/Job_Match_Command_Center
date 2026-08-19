from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes import job_search_all
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.jobs import JobSearchRequest
from app.services import jobspipe_source


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
MAX_WORKERS = 6


@router.post("/search")
def enriched_search(
    body: JobSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Extend the existing CareerNavIQ search pipeline with JobsPipe."""
    base = job_search_all.search_everywhere(body=body, user=user, db=db)
    connector_setup = dict(base.get("connector_setup") or {})
    connector_setup["jobspipe"] = jobspipe_source.configured()
    base["connector_setup"] = connector_setup

    if not jobspipe_source.configured():
        notes = list(base.get("coverage_notes") or [])
        notes.append(
            "JobsPipe integration is installed but inactive until "
            "JOBSPIPE_API_KEY is configured."
        )
        base["coverage_notes"] = list(dict.fromkeys(notes))
        return base

    profile, resume_text = job_search_all.profile_context(body, user, db)
    titles = job_search_all.query_titles(body, base)
    rows: list[dict] = []
    errors = list(base.get("errors") or [])
    coverage_notes = list(base.get("coverage_notes") or [])
    searched_sources = list(base.get("searched_sources") or [])
    source_status = list(base.get("source_status") or [])
    jobs_found = 0
    failures = 0

    futures = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for title in titles:
            future = executor.submit(
                jobspipe_source.jobs,
                title,
                body.jsearch_location,
            )
            futures[future] = title

        for future in as_completed(futures):
            title = futures[future]
            try:
                batch = future.result() or []
                rows.extend(batch)
                jobs_found += len(batch)
                if not batch:
                    coverage_notes.append(
                        f"JobsPipe returned no jobs for '{title}'."
                    )
            except Exception as exc:
                failures += 1
                errors.append(
                    f"JobsPipe {title}: "
                    f"{job_search_all.job_sources.source_error_message(exc)}"
                )

    searched_sources.append("JobsPipe")
    source_status.append(
        job_search_all.base_jobs.source_status_item(
            "JobsPipe",
            jobs_found,
            failures,
            len(titles),
        )
    )

    job_search_all.merge_rows(
        base,
        rows,
        body,
        profile,
        resume_text,
        db,
    )
    job_search_all.prioritize_target_company_results(
        base,
        base.get("target_companies_searched") or [],
    )
    base.update(
        {
            "errors": errors,
            "coverage_notes": list(dict.fromkeys(coverage_notes)),
            "searched_sources": list(dict.fromkeys(searched_sources)),
            "source_status": source_status,
        }
    )

    job_search_all.update_search_run(base, user, db)
    db.commit()
    return base
