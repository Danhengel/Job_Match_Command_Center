from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.job import Job, JobMatch, SearchRun
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.user import User
from app.schemas.jobs import JobSearchRequest
from app.services import job_sources
from app.services.cache_service import stats as cache_stats
from app.services.job_matcher import match_job


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
    expanded_titles = expand_search_titles(body.titles)

    if body.use_remotive:
        searched_sources.append("Remotive")
        remotive_jobs = 0
        remotive_failures = 0
        for title in expanded_titles:
            try:
                batch = job_sources.remotive(title)
                remotive_jobs += len(batch)
                rows += batch
                if not batch:
                    coverage_notes.append(
                        f"Remotive returned no jobs for '{title}'."
                    )
            except Exception as exc:
                remotive_failures += 1
                errors.append(f"Remotive {title}: {exc}")
        source_status.append(
            source_status_item(
                "Remotive",
                remotive_jobs,
                remotive_failures,
                len(expanded_titles),
            )
        )

    greenhouse_values = list(body.greenhouse_boards)
    lever_values = list(body.lever_boards)
    ashby_values = list(body.ashby_boards)

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
    elif greenhouse_values or lever_values or ashby_values:
        searched_sources.append("Custom employer boards")

    unique_greenhouse = list(dict.fromkeys(greenhouse_values))
    unique_lever = list(dict.fromkeys(lever_values))
    unique_ashby = list(dict.fromkeys(ashby_values))
    employer_requests = (
        len(unique_greenhouse)
        + len(unique_lever)
        + len(unique_ashby)
    )
    employer_jobs = 0
    employer_failures = 0

    for value in unique_greenhouse:
        try:
            batch = job_sources.greenhouse(value)
            employer_jobs += len(batch)
            rows += batch
            if not batch:
                coverage_notes.append(
                    f"Greenhouse board '{value}' returned no open jobs."
                )
        except Exception as exc:
            employer_failures += 1
            errors.append(f"Greenhouse {value}: {exc}")

    for value in unique_lever:
        try:
            batch = job_sources.lever(value)
            employer_jobs += len(batch)
            rows += batch
            if not batch:
                coverage_notes.append(
                    f"Lever board '{value}' returned no open jobs."
                )
        except Exception as exc:
            employer_failures += 1
            errors.append(f"Lever {value}: {exc}")

    for value in unique_ashby:
        try:
            batch = job_sources.ashby(value)
            employer_jobs += len(batch)
            rows += batch
            if not batch:
                coverage_notes.append(
                    f"Ashby board '{value}' returned no open jobs."
                )
        except Exception as exc:
            employer_failures += 1
            errors.append(f"Ashby {value}: {exc}")

    if employer_requests:
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
        for title in expanded_titles:
            query = f"{title} in {body.jsearch_location}"
            try:
                batch = job_sources.jsearch(query)
                jsearch_jobs += len(batch)
                rows += batch
                if not batch:
                    coverage_notes.append(
                        f"JSearch returned no jobs for '{query}'."
                    )
            except Exception as exc:
                jsearch_failures += 1
                errors.append(f"JSearch {title}: {exc}")
        source_status.append(
            source_status_item(
                "JSearch / Google Jobs publishers",
                jsearch_jobs,
                jsearch_failures,
                len(expanded_titles),
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

    results.sort(key=lambda item: item[1].score, reverse=True)

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
        .filter(JobMatch.profile_id == profile_id)
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
