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


def configured() -> bool:
    return bool(os.getenv("JOBSPIPE_API_KEY", "").strip())


def stable_key(company: str, title: str, url: str) -> str:
    return hashlib.sha256(
        f"JobsPipe|{company}|{title}|{url}".lower().encode()
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


def jobs(query: str, location: str = "") -> list[dict]:
    if not configured():
        raise RuntimeError("JobsPipe requires JOBSPIPE_API_KEY.")

    normalized_query = (query or "").strip()
    if not normalized_query:
        return []

    only_remote = remote_only(location)

    def load():
        payload = {
            "job_title_or": [normalized_query],
            "job_country_code_or": ["US"],
            "posted_at_max_age_days": 30,
            "limit": 25,
            "include_total_results": True,
        }
        if only_remote is True:
            payload["remote"] = True

        data = post_json(payload)
        items = data.get("data", []) if isinstance(data, dict) else []
        rows: list[dict] = []

        for item in items:
            title = str(item.get("job_title") or "").strip()
            company = str(item.get("company") or "").strip()
            url = str(item.get("final_url") or "").strip()
            if not title or not url:
                continue

            technologies = item.get("technology_slugs") or []
            if not isinstance(technologies, list):
                technologies = []
            seniority = str(item.get("seniority") or "").strip()
            raw_description = str(
                item.get("description")
                or item.get("job_description")
                or ""
            ).strip()
            if raw_description:
                description = raw_description
            else:
                description = " ".join(
                    part
                    for part in [
                        title,
                        seniority,
                        " ".join(str(value) for value in technologies),
                    ]
                    if part
                )

            rows.append(
                {
                    "provider_key": stable_key(company, title, url),
                    "title": title,
                    "company": company,
                    "location": str(item.get("location") or "").strip(),
                    "description": description,
                    "url": url,
                    "source": "JobsPipe",
                    "posted_at": str(item.get("date_posted") or "").strip(),
                    "salary": salary_text(
                        item.get("min_annual_salary_usd"),
                        item.get("max_annual_salary_usd"),
                    ),
                    "employment_type": str(
                        item.get("employment_type")
                        or item.get("job_employment_type")
                        or ""
                    ).strip(),
                    "remote": bool(item.get("remote", False)),
                }
            )
        return rows

    cache_location = (location or "").strip().lower() or "any"
    return cached(
        f"jobs:jobspipe:v1:{normalized_query.lower()}:{cache_location}",
        load,
        3600,
    )
