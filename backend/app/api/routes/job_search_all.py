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
from app.models.intelligence import CompanyWatch
from app.models.job import Job, JobMatch, SearchRun
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.user import User
from app.schemas.jobs import JobSearchRequest
from app.services import (
    careeronestop_source,
    external_job_sources,
    job_sources,
    web_discovery,
)
from app.services.job_matcher import match_job


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
MAX_EXTERNAL_TITLES = 10
MAX_EXTERNAL_WORKERS = 8
MAX_TARGET_COMPANIES = 15
PLACEMENT_AGENCIES = (
    "Robert Half",
    "Michael Page",
    "LHH",
    "Korn Ferry",
    "Selby Jennings",
    "JCW",
    "Kforce",
    "Randstad",
    "DAVRON",
    "CyberCoders",
    "gpac",
    "MRI Network",
    "KM Partners",
    "StevenDouglas",
    "The Symicor Group",
    "Atlantic Group",
)
NICHE_JOB_SOURCES = (
    ("CREFC Career Center", "CRE Finance Council career center"),
    ("MBA Career Center", "Mortgage Bankers Association career center"),
    ("OFN Job Bank", "Opportunity Finance Network CDFI job bank"),
    ("Novogradac Jobs", "Novogradac affordable housing jobs"),
    ("NALHFA Career Center", "NALHFA affordable housing finance careers"),
    ("SelectLeaders", "SelectLeaders commercial real estate finance jobs"),
)
STRATEGIC_EMPLOYERS = (
    "Suncoast Credit Union",
    "The Bank of Tampa",
    "M&T Bank",
    "Valley Bank",
    "Truist",
    "Huntington Bank",
    "Capital One",
    "U.S. Bank",
    "Wells Fargo",
    "First Citizens Bank",
    "PNC",
    "Regions Bank",
    "Fifth Third Bank",
    "JLL",
    "Cushman & Wakefield",
    "CBRE",
    "Berkadia",
    "Greystone",
    "Trimont",
    "Built Technologies",
    "Kiavi",
    "Counterpointe",
    "Land Gorilla",
    "LISC",
    "Enterprise Community Partners",
    "BlueHub Capital",
    "Low Income Investment Fund",
    "Cinnaire",
    "R4 Capital",
    "CAHEC",
)


def normalized_job_key(company: str, title: str, location: str) -> str:
    return re.sub(
        r"\W+",
        " ",
        f"{company}|{title}|{location}".lower(),
    ).strip()


def capability_note(source: str) -> str:
    notes = {
        "Brave web discovery": (
            "Brave web discovery is installed but inactive until "
            "BRAVE_SEARCH_API_KEY is configured."
        ),
        "USAJOBS": (
            "USAJOBS connector is installed but inactive until "
            "USAJOBS_API_KEY and USAJOBS_EMAIL are configured."
        ),
        "CareerOneStop / NLx": (
            "CareerOneStop is installed but inactive until "
            "CAREERONESTOP_USER_ID and CAREERONESTOP_API_TOKEN "
            "are configured."
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


def profile_context(body: JobSearchRequest, user: User, db: Session):
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
    return profile, resume_text


def query_titles(body: JobSearchRequest, base: dict) -> list[str]:
    return list(
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


def normalized_company_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def active_target_companies(user: User, db: Session) -> list[str]:
    watches = (
        db.query(CompanyWatch)
        .filter(
            CompanyWatch.user_id == user.id,
            CompanyWatch.active.is_(True),
        )
        .order_by(CompanyWatch.created_at.desc())
        .limit(MAX_TARGET_COMPANIES)
        .all()
    )
    return list(
        dict.fromkeys(
            watch.company.strip()
            for watch in watches
            if watch.company and watch.company.strip()
        )
    )


def target_company_queries(
    companies: list[str],
    titles: list[str],
    location: str,
) -> list[tuple[str, str]]:
    if not titles:
        return []
    primary_title = titles[0]
    return [
        (company, f"{primary_title} at {company} in {location}")
        for company in companies[:MAX_TARGET_COMPANIES]
    ]


def placement_agency_queries(
    titles: list[str],
    location: str,
) -> list[tuple[str, str]]:
    if not titles:
        return []

    primary_title = titles[0]
    return [
        (
            agency,
            f"{primary_title} recruiter placement agency {agency} in {location}",
        )
        for agency in PLACEMENT_AGENCIES
    ]


def niche_source_queries(
    titles: list[str],
    location: str,
) -> list[tuple[str, str]]:
    if not titles:
        return []
    primary_title = titles[0]
    return [
        (
            source_name,
            f"{primary_title} {search_term} in {location}",
        )
        for source_name, search_term in NICHE_JOB_SOURCES
    ]


def strategic_employer_queries(
    titles: list[str],
    location: str,
) -> list[tuple[str, str]]:
    if not titles:
        return []
    primary_title = titles[0]
    return [
        (
            employer,
            f"{primary_title} at {employer} in {location}",
        )
        for employer in STRATEGIC_EMPLOYERS
    ]


def prioritize_target_company_results(
    base: dict,
    companies: list[str],
) -> None:
    target_names = {
        normalized_company_name(company)
        for company in companies
        if normalized_company_name(company)
    }
    for item in base.get("results") or []:
        company = item.get("job", {}).get("company", "")
        item["target_company"] = (
            normalized_company_name(company) in target_names
        )
    base["results"] = sorted(
        base.get("results") or [],
        key=lambda item: (
            item.get("target_company", False),
            item.get("match", {}).get("score", 0),
        ),
        reverse=True,
    )


def configured_external_sources():
    capabilities = {
        **external_job_sources.connector_capabilities(),
        **web_discovery.connector_capabilities(),
        "careeronestop": careeronestop_source.configured(),
    }
    source_specs = [
        (
            "Brave web discovery",
            capabilities["brave"],
            web_discovery.brave_jobs,
        ),
        (
            "USAJOBS",
            capabilities["usajobs"],
            external_job_sources.usajobs,
        ),
        (
            "CareerOneStop / NLx",
            capabilities["careeronestop"],
            careeronestop_source.jobs,
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
    return capabilities, source_specs


def merge_rows(
    base: dict,
    rows: list[dict],
    body: JobSearchRequest,
    profile: CareerProfile | None,
    resume_text: str,
    db: Session,
) -> dict:
    unique_rows = job_sources.dedupe(rows)
    results = list(base.get("results") or [])
    original_result_keys = {
        normalized_job_key(
            item.get("job", {}).get("company", ""),
            item.get("job", {}).get("title", ""),
            item.get("job", {}).get("location", ""),
        )
        for item in results
    }
    result_keys = set(original_result_keys)
    supplemental_unique_keys = {
        normalized_job_key(
            row.get("company", ""),
            row.get("title", ""),
            row.get("location", ""),
        )
        for row in unique_rows
    }

    if profile:
        for row in unique_rows:
            result_key = normalized_job_key(
                row.get("company", ""),
                row.get("title", ""),
                row.get("location", ""),
            )
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

            if result_key not in result_keys:
                results.append(base_jobs.serialize_job(job, match))
                result_keys.add(result_key)

    results.sort(
        key=lambda item: item.get("match", {}).get("score", 0),
        reverse=True,
    )

    source_counts = Counter(base.get("source_counts") or {})
    source_counts.update(row.get("source") or "Unknown" for row in rows)
    additional_unique = len(supplemental_unique_keys - original_result_keys)

    base.update(
        {
            "results": results,
            "source_counts": dict(
                sorted(
                    source_counts.items(),
                    key=lambda item: (-item[1], item[0].lower()),
                )
            ),
            "searched": int(base.get("searched") or 0) + len(rows),
            "unique_jobs": int(base.get("unique_jobs") or 0) + additional_unique,
        }
    )
    return base


def update_search_run(base: dict, user: User, db: Session) -> None:
    search_run_id = base.get("search_run_id")
    if not search_run_id:
        return

    search_run = (
        db.query(SearchRun)
        .filter(
            SearchRun.id == search_run_id,
            SearchRun.user_id == user.id,
        )
        .first()
    )
    if not search_run:
        return

    search_run.searched_sources = base.get("searched_sources") or []
    search_run.raw_count = int(base.get("searched") or 0)
    search_run.unique_count = int(base.get("unique_jobs") or 0)
    search_run.matched_count = len(base.get("results") or [])
    search_run.errors = base.get("errors") or []
    search_run.source_counts = base.get("source_counts") or {}
    search_run.source_status = base.get("source_status") or []
    search_run.coverage_notes = base.get("coverage_notes") or []


def maximum_coverage_locations(value: str) -> list[str]:
    raw = (value or "").strip()
    normalized = raw.lower()
    locations: list[str] = []

    if "remote" not in normalized:
        locations.append("Remote")
    if normalized not in {
        "united states",
        "usa",
        "us",
        "nationwide",
        "remote",
    }:
        locations.append("United States")

    return locations


@router.post("/search-all")
def search_all(
    body: JobSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = base_jobs.search(body=body, user=user, db=db)
    profile, resume_text = profile_context(body, user, db)
    capabilities, source_specs = configured_external_sources()
    titles = query_titles(body, base)
    target_companies = active_target_companies(user, db)

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
            for title in titles:
                source_totals[source_name]["requests"] += 1
                future = executor.submit(loader, title, body.jsearch_location)
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
                errors.append(
                    f"{source_name} {title}: "
                    f"{job_sources.source_error_message(exc)}"
                )

    for source_name, totals in source_totals.items():
        source_status.append(
            base_jobs.source_status_item(
                source_name,
                totals["jobs"],
                totals["failures"],
                totals["requests"],
            )
        )

    target_queries = target_company_queries(
        target_companies,
        titles,
        body.jsearch_location,
    )
    if body.use_jsearch and target_queries:
        source_name = "JSearch target companies"
        searched_sources.append(source_name)
        target_jobs = 0
        target_failures = 0
        with ThreadPoolExecutor(max_workers=MAX_EXTERNAL_WORKERS) as executor:
            target_futures = {
                executor.submit(job_sources.jsearch, query): (company, query)
                for company, query in target_queries
            }
            for future in as_completed(target_futures):
                company, query = target_futures[future]
                try:
                    batch = future.result()
                    rows.extend(batch)
                    target_jobs += len(batch)
                    if not batch:
                        coverage_notes.append(
                            f"No current JSearch results for target company "
                            f"'{company}'."
                        )
                except Exception as exc:
                    target_failures += 1
                    errors.append(
                        f"JSearch target company {company}: "
                        f"{job_sources.source_error_message(exc)}"
                    )
        source_status.append(
            base_jobs.source_status_item(
                source_name,
                target_jobs,
                target_failures,
                len(target_queries),
            )
        )

    agency_queries = placement_agency_queries(
        titles,
        body.jsearch_location,
    )
    if body.use_jsearch and agency_queries:
        source_name = "Major placement agencies"
        searched_sources.append(source_name)
        agency_jobs = 0
        agency_failures = 0
        with ThreadPoolExecutor(max_workers=MAX_EXTERNAL_WORKERS) as executor:
            agency_futures = {
                executor.submit(job_sources.jsearch, query): (agency, query)
                for agency, query in agency_queries
            }
            for future in as_completed(agency_futures):
                agency, query = agency_futures[future]
                try:
                    batch = future.result()
                    for row in batch:
                        original_source = row.get("source") or "JSearch"
                        row["source"] = (
                            f"Placement agency: {agency} / {original_source}"
                        )
                    rows.extend(batch)
                    agency_jobs += len(batch)
                    if not batch:
                        coverage_notes.append(
                            f"No current placement-agency results from '{agency}'."
                        )
                except Exception as exc:
                    agency_failures += 1
                    errors.append(
                        f"Placement agency {agency}: "
                        f"{job_sources.source_error_message(exc)}"
                    )
        source_status.append(
            base_jobs.source_status_item(
                source_name,
                agency_jobs,
                agency_failures,
                len(agency_queries),
            )
        )

    supplemental_groups = (
        (
            "Specialized industry job boards",
            niche_source_queries(titles, body.jsearch_location),
            "Niche source",
        ),
        (
            "Strategic employer watchlist",
            strategic_employer_queries(titles, body.jsearch_location),
            "Strategic employer",
        ),
    )
    if body.use_jsearch:
        for source_name, queries, error_label in supplemental_groups:
            searched_sources.append(source_name)
            jobs_found = 0
            failures = 0
            with ThreadPoolExecutor(max_workers=MAX_EXTERNAL_WORKERS) as executor:
                query_futures = {
                    executor.submit(job_sources.jsearch, query): (name, query)
                    for name, query in queries
                }
                for future in as_completed(query_futures):
                    name, query = query_futures[future]
                    try:
                        batch = future.result()
                        rows.extend(batch)
                        jobs_found += len(batch)
                        if not batch:
                            coverage_notes.append(
                                f"No current results from '{name}'."
                            )
                    except Exception as exc:
                        failures += 1
                        errors.append(
                            f"{error_label} {name}: "
                            f"{job_sources.source_error_message(exc)}"
                        )
            source_status.append(
                base_jobs.source_status_item(
                    source_name,
                    jobs_found,
                    failures,
                    len(queries),
                )
            )

    merge_rows(base, rows, body, profile, resume_text, db)
    prioritize_target_company_results(base, target_companies)
    base.update(
        {
            "errors": errors,
            "coverage_notes": list(dict.fromkeys(coverage_notes)),
            "searched_sources": list(dict.fromkeys(searched_sources)),
            "source_status": source_status,
            "connector_setup": capabilities,
            "external_titles_searched": titles,
            "target_companies_searched": target_companies,
            "placement_agencies_searched": list(PLACEMENT_AGENCIES),
            "niche_sources_searched": [
                source_name for source_name, _term in NICHE_JOB_SOURCES
            ],
            "strategic_employers_searched": list(STRATEGIC_EMPLOYERS),
        }
    )

    update_search_run(base, user, db)
    db.commit()
    return base


@router.post("/search-everywhere")
def search_everywhere(
    body: JobSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = search_all(body=body, user=user, db=db)
    profile, resume_text = profile_context(body, user, db)
    _capabilities, source_specs = configured_external_sources()
    titles = query_titles(body, base)
    supplemental_locations = maximum_coverage_locations(body.jsearch_location)

    if not supplemental_locations:
        base["coverage_locations"] = [body.jsearch_location]
        return base

    rows: list[dict] = []
    searched_sources = list(base.get("searched_sources") or [])
    source_status = list(base.get("source_status") or [])
    coverage_notes = list(base.get("coverage_notes") or [])
    errors = list(base.get("errors") or [])
    totals: dict[str, dict[str, int]] = {}
    futures = {}

    with ThreadPoolExecutor(max_workers=MAX_EXTERNAL_WORKERS) as executor:
        if body.use_jsearch:
            source_name = "JSearch expanded coverage"
            searched_sources.append(source_name)
            totals[source_name] = {"jobs": 0, "failures": 0, "requests": 0}
            for location in supplemental_locations:
                for title in titles:
                    query = f"{title} in {location}"
                    totals[source_name]["requests"] += 1
                    future = executor.submit(job_sources.jsearch, query)
                    futures[future] = (source_name, title, location)

        needs_nationwide_external = bool(
            external_job_sources.normalized_location(body.jsearch_location)
        )
        if needs_nationwide_external:
            for source_name, configured, loader in source_specs:
                if not configured:
                    continue
                expanded_name = f"{source_name} nationwide coverage"
                searched_sources.append(expanded_name)
                totals[expanded_name] = {
                    "jobs": 0,
                    "failures": 0,
                    "requests": 0,
                }
                for title in titles:
                    totals[expanded_name]["requests"] += 1
                    future = executor.submit(loader, title, "United States")
                    futures[future] = (expanded_name, title, "United States")

        for future in as_completed(futures):
            source_name, title, location = futures[future]
            try:
                batch = future.result()
                rows.extend(batch)
                totals[source_name]["jobs"] += len(batch)
                if not batch:
                    coverage_notes.append(
                        f"{source_name} returned no jobs for '{title}' in {location}."
                    )
            except Exception as exc:
                totals[source_name]["failures"] += 1
                errors.append(
                    f"{source_name} {title} in {location}: "
                    f"{job_sources.source_error_message(exc)}"
                )

    for source_name, source_total in totals.items():
        source_status.append(
            base_jobs.source_status_item(
                source_name,
                source_total["jobs"],
                source_total["failures"],
                source_total["requests"],
            )
        )

    coverage_locations = list(
        dict.fromkeys([body.jsearch_location, *supplemental_locations])
    )
    coverage_notes.append(
        "Maximum coverage kept every existing source and added searches for: "
        + ", ".join(coverage_locations)
        + ". Duplicate postings were merged."
    )

    merge_rows(base, rows, body, profile, resume_text, db)
    prioritize_target_company_results(
        base,
        base.get("target_companies_searched") or [],
    )
    base.update(
        {
            "errors": errors,
            "coverage_notes": list(dict.fromkeys(coverage_notes)),
            "searched_sources": list(dict.fromkeys(searched_sources)),
            "source_status": source_status,
            "external_titles_searched": titles,
            "coverage_locations": coverage_locations,
        }
    )

    update_search_run(base, user, db)
    db.commit()
    return base


@router.post("/search")
def universal_search(
    body: JobSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Keep the existing frontend route while enabling maximum coverage."""
    return search_everywhere(body=body, user=user, db=db)
