from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.enterprise import CareerPageWatch
from app.models.job import Job, JobMatch, SearchRun
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.user import User
from app.schemas.jobs import JobSearchRequest
from app.services import job_sources
from app.services.cache_service import stats as cache_stats
from app.services.job_matcher import match_job
from app.services.job_quality import ranking_score


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


def serialize_job(job: Job, match: JobMatch) -> dict:
    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "url": job.url,
            "source": job.source,
            "posted_at": job.posted_at,
            "salary": job.salary,
            "employment_type": job.employment_type,
            "remote": job.remote,
        },
        "match": {
            "score": match.score,
            "title_score": match.title_score,
            "keyword_score": match.keyword_score,
            "location_score": match.location_score,
            "resume_score": match.resume_score,
            "matched_keywords": match.matched_keywords or [],
            "missing_keywords": match.missing_keywords or [],
            "concerns": match.concerns or [],
            "explanation": match.explanation,
        },
    }


def expand_search_titles(titles: list[str]) -> list[str]:
    title_expansions = {
        "construction loan administration": [
            "Construction Loan Administration",
            "Construction Lending Operations",
            "Construction Loan Operations",
            "Construction Finance Operations",
            "Construction Draw Administration",
            "Construction Loan Servicing",
        ],
        "commercial loan operations": [
            "Commercial Loan Operations",
            "Commercial Loan Servicing",
            "Loan Operations",
            "Loan Administration",
            "Commercial Lending Operations",
        ],
        "commercial loan servicing": [
            "Commercial Loan Servicing",
            "Commercial Loan Operations",
            "Loan Servicing Operations",
            "Commercial Lending Operations",
            "Loan Administration",
        ],
        "cre loan operations": [
            "CRE Loan Operations",
            "Commercial Real Estate Operations",
            "CRE Portfolio Management",
            "Commercial Real Estate Loan Servicing",
            "Real Estate Finance Operations",
        ],
        "construction lending operations": [
            "Construction Lending Operations",
            "Construction Loan Administration",
            "Construction Loan Operations",
            "Construction Finance Operations",
            "Construction Draw Administration",
        ],
        "credit administration": [
            "Credit Administration",
            "Credit Risk Management",
            "Portfolio Administration",
            "Loan Portfolio Management",
            "Credit Operations",
        ],
        "portfolio management": [
            "Portfolio Management",
            "Loan Portfolio Management",
            "Portfolio Administration",
            "Commercial Portfolio Management",
            "CRE Portfolio Management",
        ],
        "loan servicing": [
            "Loan Servicing",
            "Commercial Loan Servicing",
            "Loan Servicing Operations",
            "Specialty Loan Servicing",
            "Loan Administration",
        ],
        "asset management": [
            "Commercial Real Estate Asset Management",
            "Multifamily Asset Management",
            "Affordable Housing Asset Management",
            "Real Estate Portfolio Management",
            "Special Assets",
        ],
        "fund management": [
            "Fund Management",
            "Investment Fund Operations",
            "Investor Reporting",
            "LIHTC Fund Management",
            "Real Estate Fund Management",
        ],
        "special servicing": [
            "Special Servicing",
            "Special Assets",
            "Loan Workout",
            "Distressed Loan Management",
            "Default Management",
        ],
        "sba": [
            "SBA Loan Operations",
            "SBA Servicing",
            "Government Guaranteed Lending",
            "GGL Operations",
            "SBA Portfolio Management",
        ],
        "capital program": [
            "Capital Program Management",
            "Construction Program Management",
            "Capital Projects Director",
            "Construction Finance",
            "Program Operations Director",
        ],
    }

    expanded_titles: list[str] = []

    for title in titles:
        clean_title = title.strip()
        if not clean_title:
            continue

        expanded_titles.append(clean_title)
        normalized = clean_title.lower()

        for key, alternatives in title_expansions.items():
            if key in normalized or normalized in key:
                expanded_titles.extend(alternatives)

    return list(dict.fromkeys(expanded_titles))


def split_search_locations(value: str) -> list[str]:
    """Turn a compound UI location into source-friendly search scopes."""
    raw = (value or "").strip()
    if not raw:
        return ["United States"]

    normalized = raw.lower()
    locations: list[str] = []

    if "tampa" in normalized or "riverview" in normalized:
        locations.append("Tampa, Florida")
    if "remote" in normalized or "work from home" in normalized:
        locations.append("Remote")

    if not locations:
        locations.append(raw)

    return list(dict.fromkeys(locations))


def prioritized_search_titles(
    base_titles: list[str],
    expanded_titles: list[str],
    limit: int = 24,
) -> list[str]:
    """Preserve every requested title before adding related variants."""
    ordered = [
        *base_titles,
        *(title for title in expanded_titles if title not in base_titles),
    ]
    return list(dict.fromkeys(ordered))[:limit]


def source_status_item(
    source: str,
    jobs: int,
    failures: int = 0,
    requests: int = 1,
) -> dict:
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


@router.post("/search")
def search(
    body: JobSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(CareerProfile)
        .filter(
            CareerProfile.id == body.profile_id,
            CareerProfile.user_id == user.id,
        )
        .first()
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    primary_resume = (
        db.query(Resume)
        .filter(
            Resume.profile_id == profile.id,
            Resume.is_primary.is_(True),
        )
        .first()
    )

    resume_text = primary_resume.extracted_text if primary_resume else ""

    rows: list[dict] = []
    errors: list[str] = []
    coverage_notes: list[str] = []
    searched_sources: list[str] = []
    source_status: list[dict] = []
    base_titles = list(
        dict.fromkeys(title.strip() for title in body.titles if title.strip())
    )
    expanded_titles = expand_search_titles(base_titles)

    def run_title_source(source_name, enabled, loader, titles):
        if not enabled:
            return
        searched_sources.append(source_name)
        jobs_found = 0
        failures = 0
        for title in titles:
            try:
                batch = loader(title)
                jobs_found += len(batch)
                rows.extend(batch)
                if not batch:
                    coverage_notes.append(
                        f"{source_name} returned no jobs for '{title}'."
                    )
            except Exception as exc:
                failures += 1
                errors.append(
                    f"{source_name} {title}: "
                    f"{job_sources.source_error_message(exc)}"
                )
        source_status.append(
            source_status_item(
                source_name,
                jobs_found,
                failures,
                len(titles),
            )
        )

    run_title_source(
        "Remotive",
        body.use_remotive,
        job_sources.remotive,
        expanded_titles,
    )
    run_title_source(
        "Remote OK",
        body.use_remotive and body.use_remoteok,
        job_sources.remoteok,
        base_titles,
    )
    run_title_source(
        "Jobicy",
        body.use_remotive and body.use_jobicy,
        job_sources.jobicy,
        base_titles,
    )
    run_title_source(
        "Himalayas",
        body.use_remotive and body.use_himalayas,
        job_sources.himalayas,
        base_titles,
    )

    greenhouse_values = list(body.greenhouse_boards)
    lever_values = list(body.lever_boards)
    ashby_values = list(body.ashby_boards)
    smartrecruiters_values = list(body.smartrecruiters_boards)
    recruitee_values = list(body.recruitee_boards)
    workable_values = list(body.workable_boards)

    saved_watches: list[CareerPageWatch] = []
    if body.use_saved_career_pages:
        saved_watches = (
            db.query(CareerPageWatch)
            .filter(
                CareerPageWatch.user_id == user.id,
                CareerPageWatch.active.is_(True),
            )
            .order_by(CareerPageWatch.created_at.desc())
            .limit(250)
            .all()
        )
        unsupported_count = 0
        for watch in saved_watches:
            ats_type = (watch.ats_type or "unknown").strip().lower()
            value = (watch.board_identifier or "").strip() or watch.career_url
            if ats_type == "greenhouse":
                greenhouse_values.append(value)
            elif ats_type == "lever":
                lever_values.append(value)
            elif ats_type == "ashby":
                ashby_values.append(value)
            elif ats_type == "smartrecruiters":
                smartrecruiters_values.append(value)
            elif ats_type == "recruitee":
                recruitee_values.append(value)
            elif ats_type == "workable":
                workable_values.append(value)
            else:
                unsupported_count += 1
        if saved_watches:
            searched_sources.append("Saved career pages")
        if unsupported_count:
            coverage_notes.append(
                f"{unsupported_count} saved career page(s) use ATS platforms without a direct connector yet; broad web search may still surface their jobs."
            )

    if body.use_catalog:
        catalog = job_sources.employer_catalog()
        greenhouse_values += [
            item["board"] for item in catalog.get("greenhouse", [])
        ]
        lever_values += [
            item["board"] for item in catalog.get("lever", [])
        ]
        ashby_values += [
            item["board"] for item in catalog.get("ashby", [])
        ]
        searched_sources.append("Curated employer catalog")

    board_groups = [
        (
            "Greenhouse",
            list(dict.fromkeys(value for value in greenhouse_values if value)),
            job_sources.greenhouse,
        ),
        (
            "Lever",
            list(dict.fromkeys(value for value in lever_values if value)),
            job_sources.lever,
        ),
        (
            "Ashby",
            list(dict.fromkeys(value for value in ashby_values if value)),
            job_sources.ashby,
        ),
        (
            "SmartRecruiters",
            list(dict.fromkeys(value for value in smartrecruiters_values if value)),
            job_sources.smartrecruiters,
        ),
        (
            "Recruitee",
            list(dict.fromkeys(value for value in recruitee_values if value)),
            job_sources.recruitee,
        ),
        (
            "Workable",
            list(dict.fromkeys(value for value in workable_values if value)),
            job_sources.workable,
        ),
    ]

    employer_jobs = 0
    employer_failures = 0
    employer_requests = 0
    for source_name, values, loader in board_groups:
        for value in values:
            employer_requests += 1
            try:
                batch = loader(value)
                employer_jobs += len(batch)
                rows.extend(batch)
                if not batch:
                    coverage_notes.append(
                        f"{source_name} board '{value}' returned no open jobs."
                    )
            except Exception as exc:
                employer_failures += 1
                errors.append(
                    f"{source_name} {value}: "
                    f"{job_sources.source_error_message(exc)}"
                )

    if employer_requests:
        if "Saved career pages" not in searched_sources and not body.use_catalog:
            searched_sources.append("Custom employer boards")
        source_status.append(
            source_status_item(
                "Employer career sites",
                employer_jobs,
                employer_failures,
                employer_requests,
            )
        )

    if body.use_jsearch:
        searched_sources.append("JSearch")
        jsearch_jobs = 0
        jsearch_failures = 0
        jsearch_titles = prioritized_search_titles(
            base_titles,
            expanded_titles,
        )
        search_locations = split_search_locations(body.jsearch_location)
        for title in jsearch_titles:
            for search_location in search_locations:
                query = f"{title} in {search_location}"
                try:
                    batch = job_sources.jsearch(query)
                    jsearch_jobs += len(batch)
                    rows.extend(batch)
                    if not batch:
                        coverage_notes.append(
                            f"JSearch returned no jobs for '{query}'."
                        )
                except Exception as exc:
                    jsearch_failures += 1
                    errors.append(
                        f"JSearch {title} in {search_location}: "
                        f"{job_sources.source_error_message(exc)}"
                    )
        source_status.append(
            source_status_item(
                "JSearch / Google Jobs publishers",
                jsearch_jobs,
                jsearch_failures,
                len(jsearch_titles) * len(search_locations),
            )
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
    results: list[tuple[Job, JobMatch]] = []

    for row in unique_rows:
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

        results.append((job, match))

    unique_count = len(unique_rows)

    search_run = SearchRun(
        user_id=user.id,
        profile_id=profile.id,
        searched_sources=searched_sources,
        query_titles=expanded_titles,
        raw_count=len(rows),
        unique_count=unique_count,
        matched_count=len(results),
        minimum_score=body.minimum_score,
        errors=errors,
        source_counts=source_counts,
        source_status=source_status,
        coverage_notes=coverage_notes,
    )

    db.add(search_run)
    db.commit()

    results.sort(
        key=lambda item: ranking_score(
            item[1].score,
            item[0].source,
            item[0].posted_at,
        ),
        reverse=True,
    )

    top_below_threshold: list[dict] = []

    if not results:
        scored_all: list[tuple[Job, dict]] = []

        for row in unique_rows:
            job = (
                db.query(Job)
                .filter(Job.provider_key == row["provider_key"])
                .first()
            )
            if job:
                scored_all.append(
                    (job, match_job(job, profile, resume_text))
                )

        scored_all.sort(
            key=lambda item: item[1]["score"],
            reverse=True,
        )

        top_below_threshold = [
            {
                "title": job.title,
                "company": job.company,
                "score": score_data["score"],
                "source": job.source,
            }
            for job, score_data in scored_all[:10]
        ]

    return {
        "results": [
            serialize_job(job, match)
            for job, match in results
        ],
        "errors": errors,
        "coverage_notes": coverage_notes,
        "searched_sources": searched_sources,
        "source_counts": source_counts,
        "source_status": source_status,
        "searched": len(rows),
        "unique_jobs": unique_count,
        "cache": cache_stats(),
        "search_run_id": search_run.id,
        "expanded_titles": expanded_titles,
        "top_below_threshold": top_below_threshold,
    }


@router.get("/matches/{profile_id}")
def matches(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        .limit(300)
        .all()
    )

    return [
        serialize_job(job, match)
        for match, job in rows
    ]


@router.get("/cache")
def cache(user: User = Depends(get_current_user)):
    return cache_stats()


@router.get("/catalog")
def catalog(user: User = Depends(get_current_user)):
    data = job_sources.employer_catalog()

    return {
        "greenhouse": len(data.get("greenhouse", [])),
        "lever": len(data.get("lever", [])),
        "ashby": len(data.get("ashby", [])),
        "employers": data,
    }


@router.get("/history")
def history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(SearchRun)
        .filter(SearchRun.user_id == user.id)
        .order_by(SearchRun.created_at.desc())
        .limit(25)
        .all()
    )

    return [
        {
            "id": row.id,
            "profile_id": row.profile_id,
            "searched_sources": row.searched_sources or [],
            "query_titles": row.query_titles or [],
            "raw_count": row.raw_count,
            "unique_count": row.unique_count,
            "matched_count": row.matched_count,
            "minimum_score": row.minimum_score,
            "errors": row.errors or [],
            "source_counts": row.source_counts or {},
            "source_status": row.source_status or [],
            "coverage_notes": row.coverage_notes or [],
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]
