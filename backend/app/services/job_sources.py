from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.cache_service import get_json, set_json


TIMEOUT = 30
HEADERS = {
    "User-Agent": "CareerNavIQ/1.0 (+https://careernaviq.com)",
    "Accept": "application/json",
}
CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "employer_catalog.json"


def clean_html(value):
    return BeautifulSoup(value or "", "html.parser").get_text(" ", strip=True)


def stable_key(source, company, title, url):
    return hashlib.sha256(
        f"{source}|{company}|{title}|{url}".lower().encode()
    ).hexdigest()


def timestamp_to_iso(value):
    if value in (None, ""):
        return ""
    if isinstance(value, (int, float)):
        timestamp = float(value)
        if timestamp > 10_000_000_000:
            timestamp /= 1000
        try:
            return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
        except (OverflowError, OSError, ValueError):
            return str(value)
    return str(value)


def salary_text(minimum=None, maximum=None, currency="", period=""):
    if minimum in (None, "") and maximum in (None, ""):
        return ""
    if minimum not in (None, "") and maximum not in (None, ""):
        amount = f"{minimum} - {maximum}"
    else:
        amount = str(minimum if minimum not in (None, "") else maximum)
    return " ".join(part for part in [currency, amount, period] if part).strip()


def query_matches(row, query):
    normalized = re.sub(r"\W+", " ", (query or "").lower()).strip()
    if not normalized:
        return True
    haystack = " ".join(
        str(row.get(field) or "")
        for field in ("title", "company", "description", "employment_type")
    ).lower()
    if normalized in re.sub(r"\W+", " ", haystack):
        return True
    tokens = [token for token in normalized.split() if len(token) >= 3]
    if not tokens:
        return True
    required = 1 if len(tokens) == 1 else 2
    return sum(token in haystack for token in tokens) >= required


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


def remoteok(query):
    def load_all():
        data = get_json_url("https://remoteok.com/api")
        rows = []
        for item in data if isinstance(data, list) else []:
            title = item.get("position") or item.get("title") or ""
            if not title:
                continue
            company = item.get("company", "")
            url = item.get("apply_url") or item.get("url") or ""
            tags = item.get("tags") or []
            employment_type = ", ".join(tags) if isinstance(tags, list) else str(tags)
            rows.append(
                {
                    "provider_key": stable_key("Remote OK", company, title, url),
                    "title": title,
                    "company": company,
                    "location": item.get("location") or "Remote",
                    "description": clean_html(item.get("description")),
                    "url": url,
                    "source": "Remote OK",
                    "posted_at": item.get("date") or timestamp_to_iso(item.get("epoch")),
                    "salary": salary_text(
                        item.get("salary_min"),
                        item.get("salary_max"),
                    ),
                    "employment_type": employment_type,
                    "remote": True,
                }
            )
        return rows

    rows = cached("jobs:remoteok:all:v1", load_all, 21600)
    return [row for row in rows if query_matches(row, query)]


def jobicy(query):
    def load():
        data = get_json_url(
            "https://jobicy.com/api/v2/remote-jobs",
            params={
                "count": 100,
                "geo": "usa",
                "tag": (query or "")[:50],
            },
        )
        rows = []
        for item in data.get("jobs", []) if isinstance(data, dict) else []:
            title = item.get("jobTitle", "")
            company = item.get("companyName", "")
            url = item.get("url", "")
            job_type = item.get("jobType") or []
            rows.append(
                {
                    "provider_key": stable_key("Jobicy", company, title, url),
                    "title": title,
                    "company": company,
                    "location": item.get("jobGeo") or "Remote",
                    "description": clean_html(
                        item.get("jobDescription") or item.get("jobExcerpt")
                    ),
                    "url": url,
                    "source": "Jobicy",
                    "posted_at": item.get("pubDate", ""),
                    "salary": salary_text(
                        item.get("salaryMin"),
                        item.get("salaryMax"),
                        item.get("salaryCurrency", ""),
                        item.get("salaryPeriod", ""),
                    ),
                    "employment_type": (
                        ", ".join(job_type)
                        if isinstance(job_type, list)
                        else str(job_type or "")
                    ),
                    "remote": True,
                }
            )
        return rows

    return cached(f"jobs:jobicy:v1:{query.lower()}", load, 21600)


def himalayas(query):
    def load():
        rows = []
        for page in range(1, 4):
            data = get_json_url(
                "https://himalayas.app/jobs/api/search",
                params={
                    "q": query,
                    "country": "US",
                    "sort": "recent",
                    "page": page,
                },
            )
            jobs = data.get("jobs", []) if isinstance(data, dict) else []
            if not jobs:
                break
            for item in jobs:
                title = item.get("title", "")
                company = item.get("companyName", "")
                url = item.get("applicationLink", "")
                restrictions = item.get("locationRestrictions") or []
                location_parts = []
                for value in restrictions:
                    if isinstance(value, dict):
                        location_parts.append(value.get("name") or value.get("alpha2") or "")
                    else:
                        location_parts.append(str(value))
                location = ", ".join(filter(None, location_parts)) or "Remote"
                rows.append(
                    {
                        "provider_key": stable_key("Himalayas", company, title, url),
                        "title": title,
                        "company": company,
                        "location": location,
                        "description": clean_html(
                            item.get("description") or item.get("excerpt")
                        ),
                        "url": url,
                        "source": "Himalayas",
                        "posted_at": timestamp_to_iso(item.get("pubDate")),
                        "salary": salary_text(
                            item.get("minSalary"),
                            item.get("maxSalary"),
                            item.get("currency", ""),
                            item.get("salaryPeriod", ""),
                        ),
                        "employment_type": item.get("employmentType", "") or "",
                        "remote": True,
                    }
                )
        return rows

    return cached(f"jobs:himalayas:v1:{query.lower()}", load, 21600)


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


def smartrecruiters(board):
    match = re.search(
        r"(?:careers|jobs)\.smartrecruiters\.com/([A-Za-z0-9_-]+)",
        board,
    )
    identifier = match.group(1) if match else board.strip().strip("/")

    def load():
        rows = []
        offset = 0
        company_name = identifier.replace("-", " ").title()
        while offset < 500:
            data = get_json_url(
                f"https://api.smartrecruiters.com/v1/companies/{identifier}/postings",
                params={"limit": 100, "offset": offset, "destination": "PUBLIC"},
            )
            items = data.get("content", []) if isinstance(data, dict) else []
            if not items:
                break
            for item in items:
                title = item.get("name", "")
                company = (item.get("company") or {}).get("name") or company_name
                location_data = item.get("location") or {}
                location = ", ".join(
                    filter(
                        None,
                        [
                            location_data.get("city"),
                            location_data.get("region"),
                            location_data.get("country"),
                        ],
                    )
                )
                employment = item.get("typeOfEmployment") or {}
                posting_id = item.get("id") or item.get("uuid") or ""
                url = item.get("applyUrl") or f"https://jobs.smartrecruiters.com/{identifier}/{posting_id}"
                description_parts = []
                for value in (
                    item.get("department"),
                    item.get("function"),
                    item.get("industry"),
                ):
                    if isinstance(value, dict):
                        description_parts.extend(
                            filter(None, [value.get("label"), value.get("description")])
                        )
                rows.append(
                    {
                        "provider_key": stable_key(
                            "SmartRecruiters", company, title, url
                        ),
                        "title": title,
                        "company": company,
                        "location": location,
                        "description": " ".join(description_parts),
                        "url": url,
                        "source": "SmartRecruiters",
                        "posted_at": item.get("releasedDate", "") or "",
                        "salary": "",
                        "employment_type": employment.get("label", "") if isinstance(employment, dict) else str(employment),
                        "remote": bool(location_data.get("remote")) or "remote" in location.lower(),
                    }
                )
            offset += len(items)
            total = int(data.get("totalFound") or 0)
            if len(items) < 100 or (total and offset >= total):
                break
        return rows

    return cached(f"jobs:smartrecruiters:{identifier.lower()}", load, 43200)


def recruitee(board):
    match = re.search(r"https?://([A-Za-z0-9_-]+)\.recruitee\.com", board)
    subdomain = match.group(1) if match else board.strip().strip("/")

    def load():
        data = get_json_url(f"https://{subdomain}.recruitee.com/api/offers/")
        items = data.get("offers", []) if isinstance(data, dict) else data
        company_name = (
            data.get("company_name") if isinstance(data, dict) else None
        ) or subdomain.replace("-", " ").title()
        rows = []
        for item in items or []:
            title = item.get("title", "")
            company = item.get("company_name") or company_name
            locations = item.get("locations") or []
            location_parts = []
            for value in locations:
                if isinstance(value, dict):
                    location_parts.append(
                        value.get("name")
                        or ", ".join(
                            filter(None, [value.get("city"), value.get("country")])
                        )
                    )
                else:
                    location_parts.append(str(value))
            location = "; ".join(filter(None, location_parts)) or item.get("location", "")
            slug = item.get("slug") or item.get("id") or ""
            url = (
                item.get("careers_url")
                or item.get("url")
                or item.get("apply_url")
                or f"https://{subdomain}.recruitee.com/o/{slug}"
            )
            description = clean_html(
                item.get("description")
                or item.get("description_html")
                or item.get("requirements")
            )
            remote = bool(item.get("remote")) or "remote" in location.lower()
            rows.append(
                {
                    "provider_key": stable_key("Recruitee", company, title, url),
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": description,
                    "url": url,
                    "source": "Recruitee",
                    "posted_at": item.get("published_at") or item.get("created_at") or "",
                    "salary": item.get("salary", "") or "",
                    "employment_type": item.get("employment_type", "") or "",
                    "remote": remote,
                }
            )
        return rows

    return cached(f"jobs:recruitee:{subdomain.lower()}", load, 43200)


def workable(board):
    match = re.search(r"apply\.workable\.com/([A-Za-z0-9_-]+)", board)
    subdomain = match.group(1) if match else board.strip().strip("/")

    def load():
        data = get_json_url(
            f"https://www.workable.com/api/accounts/{subdomain}",
            params={"details": "true"},
        )
        company = data.get("name") or subdomain.replace("-", " ").title()
        rows = []
        for item in data.get("jobs", []):
            title = item.get("title", "")
            url = (
                item.get("application_url")
                or item.get("url")
                or item.get("shortlink")
                or ""
            )
            location = ", ".join(
                filter(
                    None,
                    [item.get("city"), item.get("state"), item.get("country")],
                )
            )
            workplace = item.get("workplace_type", "") or ""
            rows.append(
                {
                    "provider_key": stable_key("Workable", company, title, url),
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": clean_html(item.get("description")),
                    "url": url,
                    "source": "Workable",
                    "posted_at": item.get("published_on") or item.get("created_at") or "",
                    "salary": "",
                    "employment_type": item.get("employment_type", "") or "",
                    "remote": bool(item.get("telecommuting"))
                    or workplace == "remote"
                    or "remote" in location.lower(),
                }
            )
        return rows

    return cached(f"jobs:workable:{subdomain.lower()}", load, 43200)


def dedupe(rows):
    best = {}
    priority = {
        "Greenhouse": 10,
        "Lever": 10,
        "Ashby": 10,
        "SmartRecruiters": 10,
        "Recruitee": 10,
        "Workable": 10,
        "Himalayas": 6,
        "Jobicy": 6,
        "Remote OK": 6,
        "Remotive": 5,
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
            + priority.get(row["source"], 7) * 300
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
                "num_pages": 5,
                "country": "us",
                "date_posted": "all",
                "language": "en",
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
        f"jobs:jsearch:v7:publisher:pages5:all:{query.lower()}",
        load,
        21600,
    )
