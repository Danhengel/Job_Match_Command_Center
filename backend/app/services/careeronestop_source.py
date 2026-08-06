from __future__ import annotations

from urllib.parse import quote

from app.core.config import settings
from app.services.external_job_sources import (
    cached,
    clean_html,
    get_json_url,
    looks_remote,
    normalized_location,
    stable_key,
)


SOURCE_NAME = "CareerOneStop / NLx"
PAGE_SIZE = 100
MAX_PAGES = 3
DEFAULT_RADIUS = "50"
DEFAULT_DAYS = 60


def configured() -> bool:
    return bool(
        settings.careeronestop_user_id
        and settings.careeronestop_api_token
    )


def jobs(query: str, location: str = "") -> list[dict]:
    if not configured():
        raise RuntimeError(
            "CareerOneStop requires CAREERONESTOP_USER_ID and "
            "CAREERONESTOP_API_TOKEN."
        )

    keyword = (query or "").strip() or "0"
    search_location = normalized_location(location) or "0"

    def load():
        rows: list[dict] = []
        for page in range(MAX_PAGES):
            start_record = page * PAGE_SIZE
            path = "/".join(
                [
                    "https://api.careeronestop.org/v2/jobsearch",
                    quote(settings.careeronestop_user_id, safe=""),
                    quote(keyword, safe=""),
                    quote(search_location, safe=""),
                    DEFAULT_RADIUS,
                    "acquisitiondate",
                    "DESC",
                    str(start_record),
                    str(PAGE_SIZE),
                    str(DEFAULT_DAYS),
                ]
            )
            data = get_json_url(
                path,
                params={
                    "showFilters": "false",
                    "enableJobDescriptionSnippet": "true",
                    "enableMetaData": "false",
                },
                headers={
                    "Authorization": (
                        f"Bearer {settings.careeronestop_api_token}"
                    ),
                },
            )
            items = data.get("Jobs", []) if isinstance(data, dict) else []
            if not items:
                break

            for item in items:
                title = clean_html(item.get("JobTitle"))
                company = clean_html(item.get("Company"))
                job_location = clean_html(item.get("Location"))
                description = clean_html(item.get("DescriptionSnippet"))
                url = str(item.get("URL") or "").strip()
                if not title or not url:
                    continue
                rows.append(
                    {
                        "provider_key": stable_key(
                            SOURCE_NAME,
                            company,
                            title,
                            url,
                        ),
                        "title": title,
                        "company": company or "Employer",
                        "location": job_location,
                        "description": description,
                        "url": url,
                        "source": SOURCE_NAME,
                        "posted_at": str(
                            item.get("AcquisitionDate") or ""
                        ),
                        "salary": "",
                        "employment_type": "",
                        "remote": looks_remote(
                            title,
                            job_location,
                            description,
                        ),
                    }
                )

            if len(items) < PAGE_SIZE:
                break

        return rows

    return cached(
        "jobs:careeronestop:v1:"
        f"{keyword.lower()}:{search_location.lower()}",
        load,
        21600,
    )
