from __future__ import annotations

import hashlib
import re
from urllib.parse import quote

import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.cache_service import get_json, set_json


TIMEOUT = 30
DEFAULT_HEADERS = {
    "User-Agent": "CareerNavIQ/1.0 (+https://careernaviq.com)",
    "Accept": "application/json",
}


def clean_html(value) -> str:
    return BeautifulSoup(str(value or ""), "html.parser").get_text(" ", strip=True)


def stable_key(source: str, company: str, title: str, url: str) -> str:
    return hashlib.sha256(
        f"{source}|{company}|{title}|{url}".lower().encode()
    ).hexdigest()


def salary_text(minimum=None, maximum=None, currency="", period="") -> str:
    if minimum in (None, "") and maximum in (None, ""):
        return ""
    if minimum not in (None, "") and maximum not in (None, ""):
        amount = f"{minimum} - {maximum}"
    else:
        amount = str(minimum if minimum not in (None, "") else maximum)
    return " ".join(
        str(part) for part in (currency, amount, period) if part not in (None, "")
    ).strip()


def normalized_location(value: str) -> str:
    location = (value or "").strip()
    if not location:
        return ""
    location = re.split(r"\s+or\s+remote\b", location, maxsplit=1, flags=re.I)[0]
    location = location.strip(" ,;-")
    if location.lower() in {"remote", "united states", "usa", "us", "nationwide"}:
        return ""
    return location


def looks_remote(*values) -> bool:
    text = " ".join(str(value or "") for value in values).lower()
    return any(
        marker in text
        for marker in (
            "remote",
            "telework",
            "work from home",
            "work-from-home",
            "anywhere in the united states",
        )
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
)
def get_json_url(url, params=None, headers=None):
    merged = dict(DEFAULT_HEADERS)
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


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
)
def post_json_url(url, payload, headers=None):
    merged = dict(DEFAULT_HEADERS)
    if headers:
        merged.update(headers)
    merged.setdefault("Content-Type", "application/json")
    response = requests.post(
        url,
        json=payload,
        headers=merged,
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def cached(key: str, loader, ttl: int = 21600):
    hit = get_json(key)
    if hit is not None:
        return hit
    data = loader()
    set_json(key, data, ttl)
    return data


def usajobs_configured() -> bool:
    return bool(settings.usajobs_api_key and settings.usajobs_email)


def adzuna_configured() -> bool:
    return bool(settings.adzuna_app_id and settings.adzuna_app_key)


def jooble_configured() -> bool:
    return bool(settings.jooble_api_key)


def connector_capabilities() -> dict[str, bool]:
    return {
        "usajobs": usajobs_configured(),
        "adzuna": adzuna_configured(),
        "jooble": jooble_configured(),
    }


def usajobs(query: str, location: str = "") -> list[dict]:
    if not usajobs_configured():
        raise RuntimeError(
            "USAJOBS requires USAJOBS_API_KEY and USAJOBS_EMAIL."
        )

    search_location = normalized_location(location)

    def load():
        params = {
            "Keyword": query,
            "ResultsPerPage": 500,
            "WhoMayApply": "Public",
            "Fields": "Full",
            "SortField": "opendate",
            "SortDirection": "desc",
        }
        if search_location:
            params["LocationName"] = search_location

        data = get_json_url(
            "https://data.usajobs.gov/api/search",
            params=params,
            headers={
                "Host": "data.usajobs.gov",
                "User-Agent": settings.usajobs_email,
                "Authorization-Key": settings.usajobs_api_key,
            },
        )
        items = (
            (data.get("SearchResult") or {}).get("SearchResultItems")
            if isinstance(data, dict)
            else []
        ) or []
        rows = []

        for item in items:
            descriptor = item.get("MatchedObjectDescriptor") or {}
            title = descriptor.get("PositionTitle") or ""
            company = (
                descriptor.get("OrganizationName")
                or descriptor.get("DepartmentName")
                or "U.S. Federal Government"
            )
            apply_urls = descriptor.get("ApplyURI") or []
            if isinstance(apply_urls, str):
                apply_urls = [apply_urls]
            url = descriptor.get("PositionURI") or (apply_urls[0] if apply_urls else "")

            locations = descriptor.get("PositionLocation") or []
            if isinstance(locations, dict):
                locations = [locations]
            location_names = []
            for entry in locations:
                if isinstance(entry, dict):
                    location_names.append(
                        entry.get("LocationName")
                        or ", ".join(
                            filter(
                                None,
                                [
                                    entry.get("CityName"),
                                    entry.get("CountrySubDivisionCode"),
                                    entry.get("CountryCode"),
                                ],
                            )
                        )
                    )
                elif entry:
                    location_names.append(str(entry))
            job_location = "; ".join(filter(None, location_names))

            remuneration = descriptor.get("PositionRemuneration") or []
            if isinstance(remuneration, dict):
                remuneration = [remuneration]
            salary = ""
            if remuneration:
                pay = remuneration[0] or {}
                salary = salary_text(
                    pay.get("MinimumRange"),
                    pay.get("MaximumRange"),
                    pay.get("Description") or "$",
                    pay.get("RateIntervalCode") or "",
                )

            offering = descriptor.get("PositionOfferingType") or {}
            if isinstance(offering, dict):
                employment_type = offering.get("Name") or offering.get("Code") or ""
            else:
                employment_type = str(offering or "")

            user_details = (
                (descriptor.get("UserArea") or {}).get("Details")
                if isinstance(descriptor.get("UserArea"), dict)
                else {}
            ) or {}
            duties = user_details.get("MajorDuties") or []
            if isinstance(duties, str):
                duties = [duties]
            description = clean_html(
                user_details.get("JobSummary")
                or user_details.get("QualificationSummary")
                or " ".join(str(value) for value in duties[:4])
            )

            rows.append(
                {
                    "provider_key": stable_key("USAJOBS", company, title, url),
                    "title": title,
                    "company": company,
                    "location": job_location,
                    "description": description,
                    "url": url,
                    "source": "USAJOBS",
                    "posted_at": descriptor.get("PublicationStartDate") or "",
                    "salary": salary,
                    "employment_type": employment_type,
                    "remote": looks_remote(
                        job_location,
                        description,
                        user_details.get("RemoteIndicator"),
                    ),
                }
            )
        return rows

    cache_location = search_location.lower() or "nationwide"
    return cached(
        f"jobs:usajobs:v1:{query.lower()}:{cache_location}",
        load,
        21600,
    )


def adzuna(query: str, location: str = "") -> list[dict]:
    if not adzuna_configured():
        raise RuntimeError(
            "Adzuna requires ADZUNA_APP_ID and ADZUNA_APP_KEY."
        )

    search_location = normalized_location(location)

    def load():
        rows = []
        for page in range(1, 4):
            params = {
                "app_id": settings.adzuna_app_id,
                "app_key": settings.adzuna_app_key,
                "results_per_page": 50,
                "what": query,
                "sort_by": "date",
                "content-type": "application/json",
            }
            if search_location:
                params["where"] = search_location

            data = get_json_url(
                f"https://api.adzuna.com/v1/api/jobs/us/search/{page}",
                params=params,
            )
            items = data.get("results", []) if isinstance(data, dict) else []
            if not items:
                break

            for item in items:
                title = clean_html(item.get("title"))
                company_data = item.get("company") or {}
                company = (
                    company_data.get("display_name")
                    if isinstance(company_data, dict)
                    else str(company_data or "")
                )
                location_data = item.get("location") or {}
                job_location = (
                    location_data.get("display_name")
                    if isinstance(location_data, dict)
                    else str(location_data or "")
                )
                description = clean_html(item.get("description"))
                url = item.get("redirect_url") or item.get("url") or ""
                employment_type = " ".join(
                    value
                    for value in (
                        item.get("contract_time") or "",
                        item.get("contract_type") or "",
                    )
                    if value
                )
                rows.append(
                    {
                        "provider_key": stable_key("Adzuna", company, title, url),
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "description": description,
                        "url": url,
                        "source": "Adzuna",
                        "posted_at": item.get("created") or "",
                        "salary": salary_text(
                            item.get("salary_min"),
                            item.get("salary_max"),
                            "$",
                        ),
                        "employment_type": employment_type,
                        "remote": looks_remote(job_location, description, title),
                    }
                )

            if len(items) < 50:
                break
        return rows

    cache_location = search_location.lower() or "nationwide"
    return cached(
        f"jobs:adzuna:v1:{query.lower()}:{cache_location}",
        load,
        21600,
    )


def jooble(query: str, location: str = "") -> list[dict]:
    if not jooble_configured():
        raise RuntimeError("Jooble requires JOOBLE_API_KEY.")

    search_location = normalized_location(location) or "United States"

    def load():
        rows = []
        endpoint = f"https://jooble.org/api/{quote(settings.jooble_api_key, safe='')}"
        for page in range(1, 4):
            data = post_json_url(
                endpoint,
                {
                    "keywords": query,
                    "location": search_location,
                    "radius": "80",
                    "page": str(page),
                    "ResultOnPage": "50",
                    "SearchMode": "1",
                    "companysearch": "false",
                },
            )
            items = data.get("jobs", []) if isinstance(data, dict) else []
            if not items:
                break

            for item in items:
                title = clean_html(item.get("title"))
                company = clean_html(item.get("company"))
                job_location = clean_html(item.get("location"))
                description = clean_html(item.get("snippet"))
                url = item.get("link") or ""
                publisher = clean_html(item.get("source")) or "Jooble"
                rows.append(
                    {
                        "provider_key": stable_key("Jooble", company, title, url),
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "description": description,
                        "url": url,
                        "source": publisher,
                        "posted_at": item.get("updated") or "",
                        "salary": clean_html(item.get("salary")),
                        "employment_type": clean_html(item.get("type")),
                        "remote": looks_remote(job_location, description, title),
                    }
                )

            if len(items) < 50:
                break
        return rows

    return cached(
        f"jobs:jooble:v1:{query.lower()}:{search_location.lower()}",
        load,
        21600,
    )


def dedupe(rows: list[dict]) -> list[dict]:
    best: dict[str, tuple[int, dict]] = {}
    priorities = {
        "USAJOBS": 11,
        "Adzuna": 7,
        "Jooble": 7,
    }
    for row in rows:
        key = re.sub(
            r"\W+",
            " ",
            f"{row.get('company', '')}|{row.get('title', '')}|{row.get('location', '')}".lower(),
        ).strip()
        quality = len(row.get("description", "")) + priorities.get(
            row.get("source", ""),
            6,
        ) * 300
        if key not in best or quality > best[key][0]:
            best[key] = (quality, row)
    return [item[1] for item in best.values()]
