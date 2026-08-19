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
BROAD_JOBSPIPE_LIMIT = 17
MAJOR_BOARD_LIMIT = 2


@router.post("/search")
def enriched_search(
    body: JobSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run maximum coverage plus explicit probes of major job boards."""
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

    search_specs = [
        ("JobsPipe broad coverage", None, BROAD_JOBSPIPE_LIMIT),
        *[
            (f"JobsPipe / {label}", [source_key], MAJOR_BOARD_LIMIT)
            for source_key, label in jobspipe_source.MAJOR_BOARD_SOURCES.items()
        ],
    ]
    totals = {
        name: {"jobs": 0, "failures": 0, "requests": 1}
        for name, _sources, _limit in search_specs
    }

    futures = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for source_name, sources, limit in search_specs:
            searched_sources.append(source_name)
            future = executor.submit(
                jobspipe_source.jobs,
                titles,
                body.jsearch_location,
                sources,
                limit,
            )
            futures[future] = (source_name, sources)

        for future in as_completed(futures):
            source_name, sources = futures[future]
            try:
                batch = future.result() or []
                rows.extend(batch)
                totals[source_name]["jobs"] += len(batch)
                if not batch:
                    if sources:
                        label = jobspipe_source.source_label(sources[0])
                        coverage_notes.append(
                            f"{label} returned no current JobsPipe matches for this search."
                        )
                    else:
                        coverage_notes.append(
                            "JobsPipe broad coverage returned no current matches."
                        )
            except Exception as exc:
                totals[source_name]["failures"] += 1
                errors.append(
                    f"{source_name}: "
                    f"{job_search_all.job_sources.source_error_message(exc)}"
                )

    major_board_coverage = {}
    for source_name, sources, _limit in search_specs:
        values = totals[source_name]
        source_status.append(
            job_search_all.base_jobs.source_status_item(
                source_name,
                values["jobs"],
                values["failures"],
                values["requests"],
            )
        )
        if sources:
            label = jobspipe_source.source_label(sources[0])
            if values["jobs"]:
                status = "success"
            elif values["failures"]:
                status = "failed"
            else:
                status = "empty"
            major_board_coverage[label] = {
                "status": status,
                "jobs": values["jobs"],
                "via": "JobsPipe",
            }

    major_board_coverage["Google Jobs publishers"] = {
        "status": "enabled",
        "via": "JSearch",
    }
    major_board_coverage["Direct employer career sites"] = {
        "status": "enabled",
        "via": "CareerNavIQ ATS connectors",
    }

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
            "major_board_coverage": major_board_coverage,
        }
    )

    job_search_all.update_search_run(base, user, db)
    db.commit()
    return base
