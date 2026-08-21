from __future__ import annotations

import hashlib
import os

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from app.services.cache_service import get_json, set_json


TIMEOUT = 30
BASE_URL = "https://api.jobspipe.dev"
HEADERS = {
    "User-Agent": "CareerNavIQ/1.0 (+https://careernaviq.com)",
    "Accept": "application/json",
    "Content-Type": "application/json",
}
MAJOR_BOARD_SOURCES = {
    "indeed": "Indeed",
    "linkedin": "LinkedIn",
    "glassdoor": "Glassdoor",
    "ziprecruiter": "ZipRecruiter",
    "usajobs": "USAJOBS",
    "ycombinator": "Y Combinator Jobs",
}
# Query these large and specialist publishers as one source group so searches gain
# breadth without multiplying API usage by one request per board.
EXPANDED_BOARD_SOURCES = {
    "monster": "Monster",
    "careerbuilder": "CareerBuilder",
    "dice": "Dice",
    "simplyhired": "SimplyHired",
    "wellfound": "Wellfound",
    "builtin": "Built In",
    "themuse": "The Muse",
    "efinancialcareers": "eFinancialCareers",
    "governmentjobs": "GovernmentJobs",
    "jooble": "Jooble",
    "adzuna": "Adzuna",
    "careeronestop": "CareerOneStop / NLx",
    "flexjobs": "FlexJobs",
    "theladders": "Ladders",
    "idealist": "Idealist",
    "higheredjobs": "HigherEdJobs",
    "joinhandshake": "Handshake",
    "weworkremotely": "We Work Remotely",
    "remote-co": "Remote.co",
    "talent": "Talent.com",
    "careerjet": "Careerjet",
}
CORE_ATS_COVERAGE = [
    "Workday",
    "Greenhouse",
    "Lever",
    "Ashby",
    "SmartRecruiters",
    "iCIMS",
    "Workable",
    "BambooHR",
    "Paycom",
    "Paylocity",
    "SAP SuccessFactors",
    "Jobvite",
    "Taleo",
    "Oracle Recruiting Cloud",
    "Dayforce",
    "Cornerstone",
    "Rippling",
    "Teamtailor",
    "Personio",
    "Breezy HR",
    "JazzHR",
]
SPECIALTY_DISCOVERY_TARGETS = [
    "Monster",
    "CareerBuilder",
    "Dice",
    "SimplyHired",
    "Wellfound",
    "Built In",
    "The Muse",
    "eFinancialCareers",
    "GovernmentJobs",
    "Jooble",
    "Adzuna",
    "CareerOneStop / NLx",
    "FlexJobs",
    "Ladders",
    "Idealist",
    "HigherEdJobs",
    "Handshake",
    "We Work Remotely",
    "Remote.co",
    "Talent.com",
    "Careerjet",
]


def configured() -> bool:
    return bool(os.getenv("JOBSPIPE_API_KEY", "").strip())


def stable_key(source: str, company: str, title: str, url: str) -> str:
    return hashlib.sha256(
        f"JobsPipe|{source}|{company}|{title}|{url}".lower().encode()
    ).hexdigest()


def salary_text(minimum=None, maximum=None) -> str:
    if minimum in (None, "") and maximum in (None, ""):
        return ""

    def money(value):
        try:
            return f"${float(value):,.0f}"
        except (TypeError, ValueError):
            return str(value or "")

    if minimum not in (None, "") and maximum not in (None, ""):
        return f"{money(minimum)} - {money(maximum)} / year"
    return f"{money(minimum if minimum not in (None, '') else maximum)} / year"


def remote_only(location: str) -> bool | None:
    normalized = (location or "").strip().lower()
    if normalized in {"remote", "remote only", "fully remote"}:
        return True
    return None


def normalize_titles(query: str | list[str]) -> list[str]:
    values = [query] if isinstance(query, str) else list(query or [])
    return list(
        dict.fromkeys(
            str(value or "").strip()
            for value in values
            if str(value or "").strip()
        )
    )[:12]


def normalize_location(value) -> tuple[str, bool]:
    if isinstance(value, dict):
        text = ", ".join(
            str(value.get(key) or "").strip()
            for key in ("city", "region", "country")
            if str(value.get(key) or "").strip()
        )
        return text, bool(value.get("remote"))
    text = str(value or "").strip()
    return text, "remote" in text.lower()


def source_label(value: str) -> str:
    normalized = (value or "").strip().lower()
    if normalized in MAJOR_BOARD_SOURCES:
        return MAJOR_BOARD_SOURCES[normalized]
    if not normalized:
        return "JobsPipe"
    return normalized.replace("-", " ").replace("_", " ").title()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
)
def post_json(payload: dict) -> dict:
    api_key = os.getenv("JOBSPIPE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("JobsPipe requires JOBSPIPE_API_KEY.")

    headers = dict(HEADERS)
    headers["Authorization"] = f"Bearer {api_key}"
    response = requests.post(
        f"{BASE_URL}/v1/jobs/search",
        json=payload,
        headers=headers,
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def cached(key: str, loader, ttl: int = 3600):
    hit = get_json(key)
    if hit is not None:
        return hit
    data = loader()
    set_json(key, data, ttl)
    return data


def jobs(
    query: str | list[str],
    location: str = "",
    sources: list[str] | tuple[str, ...] | None = None,
    limit: int = 25,
) -> list[dict]:
    if not configured():
        raise RuntimeError("JobsPipe requires JOBSPIPE_API_KEY.")

    titles = normalize_titles(query)
    if not titles:
        return []

    normalized_sources = [
        str(value or "").strip().lower()
        for value in (sources or [])
        if str(value or "").strip()
    ]
    result_limit = max(1, min(int(limit or 25), 100))
    only_remote = remote_only(location)

    def load():
        payload = {
            "job_title_or": titles,
            "job_country_code_or": ["US"],
            "posted_at_max_age_days": 30,
            "limit": result_limit,
            "include_total_results": True,
        }
        if normalized_sources:
            payload["source_or"] = normalized_sources
        if only_remote is True:
            payload["remote"] = True

        data = post_json(payload)
        items = data.get("data", []) if isinstance(data, dict) else []
        rows: list[dict] = []

        for item in items:
            title = str(item.get("job_title") or item.get("title") or "").strip()
            company = str(item.get("company") or "").strip()
            url = str(
                item.get("final_url")
                or item.get("apply_url")
                or item.get("url")
                or ""
            ).strip()
            if not title or not url:
                continue

            collector_source = str(item.get("source") or "jobspipe").strip().lower()
            display_source = source_label(collector_source)
            technologies = item.get("technology_slugs") or []
            if not isinstance(technologies, list):
                technologies = []
            seniority = str(item.get("seniority") or "").strip()
            raw_description = str(
                item.get("description")
                or item.get("job_description")
                or ""
            ).strip()
            description = raw_description or " ".join(
                part
                for part in [
                    title,
                    seniority,
                    " ".join(str(value) for value in technologies),
                ]
                if part
            )

            job_location, location_remote = normalize_location(item.get("location"))
            salary = item.get("salary") or {}
            if isinstance(salary, dict):
                minimum = salary.get("min")
                maximum = salary.get("max")
            else:
                minimum = maximum = None
            minimum = item.get("min_annual_salary_usd", minimum)
            maximum = item.get("max_annual_salary_usd", maximum)

            rows.append(
                {
                    "provider_key": stable_key(
                        collector_source,
                        company,
                        title,
                        url,
                    ),
                    "title": title,
                    "company": company,
                    "location": job_location,
                    "description": description,
                    "url": url,
                    "source": display_source,
                    "posted_at": str(
                        item.get("date_posted")
                        or item.get("posted_at")
                        or ""
                    ).strip(),
                    "salary": salary_text(minimum, maximum),
                    "employment_type": str(
                        item.get("employment_type")
                        or item.get("job_employment_type")
                        or ""
                    ).strip(),
                    "remote": bool(item.get("remote", False)) or location_remote,
                }
            )
        return rows

    cache_location = (location or "").strip().lower() or "any"
    cache_sources = ",".join(normalized_sources) or "all"
    cache_titles = "|".join(value.lower() for value in titles)
    return cached(
        f"jobs:jobspipe:v2:{cache_sources}:{result_limit}:{cache_titles}:{cache_location}",
        load,
        3600,
    )
