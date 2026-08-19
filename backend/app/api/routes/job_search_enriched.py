from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes import job_search_all
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.user import User
from app.schemas.jobs import JobSearchRequest
from app.services import job_quality, jobspipe_source


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
MAX_WORKERS = 8
BROAD_JOBSPIPE_LIMIT = 13
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
        base["results"] = job_quality.rank_serialized_results(base.get("results") or [])
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

    ats_coverage = {
        name: {"status": "enabled", "via": "JobsPipe broad coverage"}
        for name in jobspipe_source.CORE_ATS_COVERAGE
    }
    specialty_board_coverage = {
        name: {
            "status": "discovery",
            "via": "JSearch / Google Jobs and employer-source dedupe",
        }
        for name in jobspipe_source.SPECIALTY_DISCOVERY_TARGETS
    }

    coverage_notes.append(
        "CareerNavIQ also checks specialty publishers through Google Jobs/JSearch "
        "when their listings are indexed there, while preferring the original "
        "employer posting when the same job is available from an ATS."
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
            "major_board_coverage": major_board_coverage,
            "ats_coverage": ats_coverage,
            "specialty_board_coverage": specialty_board_coverage,
        }
    )

    # Keep the visible match percentage intact, but use source authority and
    # posting freshness as secondary ranking signals.
    base["results"] = job_quality.rank_serialized_results(base.get("results") or [])

    job_search_all.update_search_run(base, user, db)
    db.commit()
    return base


@router.get("/matches/{profile_id}")
def active_matches(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return only active stored matches, ranked by match, freshness, and source quality."""
    profile = (
        db.query(CareerProfile)
        .filter(
            CareerProfile.id == profile_id,
            CareerProfile.user_id == user.id,
        )
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    rows = (
        db.query(JobMatch, Job)
        .join(Job, Job.id == JobMatch.job_id)
        .filter(
            JobMatch.profile_id == profile_id,
            Job.active.is_(True),
        )
        .order_by(JobMatch.score.desc())
        .limit(500)
        .all()
    )

    results = []
    for match, job in rows:
        item = job_search_all.base_jobs.serialize_job(job, match)
        job_quality.enrich_serialized_result(
            item,
            job.verification_status or "unverified",
        )
        results.append(item)

    results.sort(
        key=lambda item: (
            float((item.get("ranking") or {}).get("score", 0)),
            float((item.get("match") or {}).get("score", 0)),
        ),
        reverse=True,
    )
    return results[:300]