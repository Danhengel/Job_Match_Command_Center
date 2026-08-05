from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.cache_service import get_json, set_json


TIMEOUT = 30
HEADERS = {
    "User-Agent": "JobMatchCommandCenter/1.0",
    "Accept": "application/json",
}
CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "employer_catalog.json"


def clean_html(value):
    return BeautifulSoup(value or "", "html.parser").get_text(" ", strip=True)


def stable_key(source, company, title, url):
    return hashlib.sha256(
        f"{source}|{company}|{title}|{url}".lower().encode()
    ).hexdigest()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
)
def get_json_url(url, params=None, headers=None):
    merged = dict(HEADERS)
    if headers:
        merged.update(headers)
    response = requests.get(
        url,
        params=params,
        headers=merged,
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def cached(key, loader, ttl=21600):
    hit = get_json(key)
    if hit is not None:
        return hit
    data = loader()
    set_json(key, data, ttl)
    return data


def employer_catalog() -> dict:
    try:
        return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {
            "greenhouse": [],
            "lever": [],
            "ashby": [],
        }


def remotive(query):
    def load():
        data = get_json_url(
            "https://remotive.com/api/remote-jobs",
            params={"search": query, "limit": 100},
        )
        rows = []
        for item in data.get("jobs", []):
            title = item.get("title", "")
            company = item.get("company_name", "")
            url = item.get("url", "")
            rows.append(
                {
                    "provider_key": stable_key(
                        "Remotive",
                        company,
                        title,
                        url,
                    ),
                    "title": title,
                    "company": company,
                    "location": (
                        item.get("candidate_required_location") or "Remote"
                    ),
                    "description": clean_html(item.get("description")),
                    "url": url,
                    "source": "Remotive",
                    "posted_at": item.get("publication_date", ""),
                    "salary": item.get("salary", "") or "",
                    "employment_type": item.get("job_type", "") or "",
                    "remote": True,
                }
            )
        return rows

    return cached(f"jobs:remotive:{query.lower()}", load, 21600)


def greenhouse(board):
    token = re.sub(
        r"^.*boards\.greenhouse\.io/",
        "",
        board.strip(),
    ).split("/")[0]

    def load():
        data = get_json_url(
            f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs",
            params={"content": "true"},
        )
        company = token.replace("-", " ").title()
        rows = []
        for item in data.get("jobs", []):
            title = item.get("title", "")
            url = item.get("absolute_url", "")
            location = (item.get("location") or {}).get("name", "")
            rows.append(
                {
                    "provider_key": stable_key(
                        "Greenhouse",
                        company,
                        title,
                        url,
                    ),
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": clean_html(item.get("content")),
                    "url": url,
                    "source": "Greenhouse",
                    "posted_at": item.get("updated_at", ""),
                    "salary": "",
                    "employment_type": "",
                    "remote": "remote" in location.lower(),
                }
            )
        return rows

    return cached(f"jobs:greenhouse:{token.lower()}", load, 43200)


def lever(site):
    match = re.search(r"jobs\.lever\.co/([A-Za-z0-9_-]+)", site)
    site = match.group(1) if match else site.strip()

    def load():
        data = get_json_url(
            f"https://api.lever.co/v0/postings/{site}",
            params={"mode": "json"},
        )
        company = site.replace("-", " ").title()
        rows = []
        for item in data:
            categories = item.get("categories") or {}
            title = item.get("text", "")
            url = item.get("hostedUrl") or item.get("applyUrl") or ""
            location = categories.get("location", "")
            rows.append(
                {
                    "provider_key": stable_key(
                        "Lever",
                        company,
                        title,
                        url,
                    ),
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": item.get("descriptionPlain", ""),
                    "url": url,
                    "source": "Lever",
                    "posted_at": "",
                    "salary": "",
                    "employment_type": categories.get("commitment", ""),
                    "remote": "remote" in location.lower(),
                }
            )
        return rows

    return cached(f"jobs:lever:{site.lower()}", load, 43200)


def ashby(board):
    match = re.search(r"jobs\.ashbyhq\.com/([A-Za-z0-9_-]+)", board)
    board = match.group(1) if match else board.strip()

    def load():
        data = get_json_url(
            f"https://api.ashbyhq.com/posting-api/job-board/{board}",
            params={"includeCompensation": "true"},
        )
        company = board.replace("-", " ").title()
        rows = []
        for item in data.get("jobs", []):
            if item.get("isListed") is False:
                continue
            title = item.get("title", "")
            url = item.get("jobUrl") or item.get("applyUrl") or ""
            location = item.get("location", "") or ""
            compensation = item.get("compensation") or {}
            salary = (
                compensation.get("compensationTierSummary")
                or compensation.get(
                    "scrapeableCompensationSalarySummary"
                )
                or ""
            )
            rows.append(
                {
                    "provider_key": stable_key(
                        "Ashby",
                        company,
                        title,
                        url,
                    ),
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": clean_html(
                        item.get("descriptionHtml")
                        or item.get("descriptionPlain")
                    ),
                    "url": url,
                    "source": "Ashby",
                    "posted_at": item.get("publishedAt", "") or "",
                    "salary": salary,
                    "employment_type": (
                        item.get("employmentType", "") or ""
                    ),
                    "remote": bool(item.get("isRemote"))
                    or "remote" in location.lower(),
                }
            )
        return rows

    return cached(f"jobs:ashby:{board.lower()}", load, 43200)


def dedupe(rows):
    best = {}
    priority = {
        "Greenhouse": 9,
        "Lever": 9,
        "Ashby": 9,
        "Remotive": 4,
    }
    for row in rows:
        key = re.sub(
            r"\W+",
            " ",
            (
                f"{row['company']}|{row['title']}|"
                f"{row['location']}"
            ).lower(),
        ).strip()
        quality = (
            len(row.get("description", ""))
            + priority.get(row["source"], 6) * 300
        )
        if key not in best or quality > best[key][0]:
            best[key] = (quality, row)
    return [item[1] for item in best.values()]


def jsearch(query):
    if not settings.rapidapi_key:
        raise RuntimeError(
            "JSearch is enabled but RAPIDAPI_KEY is not configured."
        )

    def load():
        data = get_json_url(
            "https://jsearch.p.rapidapi.com/search-v2",
            params={
                "query": query,
                "num_pages": 3,
                "country": "us",
                "date_posted": "month",
            },
            headers={
                "X-RapidAPI-Key": settings.rapidapi_key,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
        )

        payload = data.get("data") or {}
        jobs = payload.get("jobs", []) if isinstance(payload, dict) else payload
        rows = []

        for item in jobs or []:
            title = item.get("job_title", "")
            company = item.get("employer_name", "")
            url = (
                item.get("job_apply_link")
                or item.get("job_google_link")
                or ""
            )
            publisher = (
                item.get("job_publisher")
                or item.get("job_source")
                or "JSearch"
            )

            location = ", ".join(
                filter(
                    None,
                    [
                        item.get("job_city"),
                        item.get("job_state"),
                        item.get("job_country"),
                    ],
                )
            )

            salary = ""
            if (
                item.get("job_min_salary")
                or item.get("job_max_salary")
            ):
                salary = (
                    f"{item.get('job_min_salary') or ''} - "
                    f"{item.get('job_max_salary') or ''} "
                    f"{item.get('job_salary_period') or ''}"
                ).strip()

            employment_type = (
                item.get("job_employment_type")
                or ", ".join(
                    item.get("job_employment_types") or []
                )
                or ""
            )

            rows.append(
                {
                    "provider_key": stable_key(
                        "JSearch",
                        company,
                        title,
                        url,
                    ),
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": item.get("job_description", ""),
                    "url": url,
                    "source": publisher,
                    "posted_at": (
                        item.get("job_posted_at_datetime_utc")
                        or item.get("job_posted_at")
                        or ""
                    ),
                    "salary": salary,
                    "employment_type": employment_type,
                    "remote": bool(item.get("job_is_remote")),
                }
            )

        return rows

    return cached(
        f"jobs:jsearch:v6:publisher:pages3:month:{query.lower()}",
        load,
        21600,
    )
