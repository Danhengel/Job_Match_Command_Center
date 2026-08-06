from __future__ import annotations

import hashlib
import ipaddress
import json
import re
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.cache_service import get_json, set_json


TIMEOUT = 25
MAX_PAGE_BYTES = 2_000_000
DIRECT_ATS = {
    "greenhouse": r"(?:boards|job-boards)\.greenhouse\.io/([^/?#]+)",
    "lever": r"jobs\.lever\.co/([^/?#]+)",
    "ashby": r"jobs\.ashbyhq\.com/([^/?#]+)",
    "smartrecruiters": r"(?:careers|jobs)\.smartrecruiters\.com/([^/?#]+)",
    "recruitee": r"https?://([^.]+)\.recruitee\.com",
    "workable": r"(?:apply\.)?workable\.com/([^/?#]+)",
}
ATS_HOSTS = {
    "workday": ("myworkdayjobs.com", "workdayjobs.com"),
    "icims": ("icims.com",),
    "taleo": ("taleo.net",),
    "oracle": ("oraclecloud.com", "oracle.com"),
    "successfactors": ("successfactors.com",),
    "governmentjobs": ("governmentjobs.com",),
    "adp": ("jobs.adp.com", "workforcenow.adp.com"),
    "ukg": ("ukg.com",),
    "dayforce": ("dayforcehcm.com",),
    "paylocity": ("paylocity.com",),
}
ATS_LABELS = {
    "greenhouse": "Greenhouse",
    "lever": "Lever",
    "ashby": "Ashby",
    "smartrecruiters": "SmartRecruiters",
    "recruitee": "Recruitee",
    "workable": "Workable",
    "workday": "Workday",
    "icims": "iCIMS",
    "taleo": "Taleo",
    "oracle": "Oracle Recruiting",
    "successfactors": "SuccessFactors",
    "governmentjobs": "GovernmentJobs",
    "adp": "ADP Recruiting",
    "ukg": "UKG",
    "dayforce": "Dayforce",
    "paylocity": "Paylocity",
}
BLOCKED_DOMAINS = {
    "indeed.com",
    "linkedin.com",
    "glassdoor.com",
    "ziprecruiter.com",
    "monster.com",
}


def clean_html(value) -> str:
    return BeautifulSoup(str(value or ""), "html.parser").get_text(" ", strip=True)


def stable_key(source: str, company: str, title: str, url: str) -> str:
    return hashlib.sha256(
        f"{source}|{company}|{title}|{url}".lower().encode()
    ).hexdigest()


def connector_capabilities() -> dict[str, bool]:
    return {"brave": bool(settings.brave_search_api_key)}


def detect_ats(url: str) -> str:
    for name, pattern in DIRECT_ATS.items():
        if re.search(pattern, url or "", re.I):
            return name
    host = (urlparse(url or "").hostname or "").lower()
    for name, domains in ATS_HOSTS.items():
        if any(host == domain or host.endswith(f".{domain}") for domain in domains):
            return name
    return "generic"


def canonicalize_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        return ""
    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith("utm_")
        and key.lower() not in {"gclid", "fbclid", "msclkid"}
    ]
    return urlunparse(
        (
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            re.sub(r"/{2,}", "/", parsed.path or "/"),
            "",
            urlencode(query, doseq=True),
            "",
        )
    )


def validate_public_url(url: str, resolve_dns: bool = False) -> str:
    canonical = canonicalize_url(url)
    parsed = urlparse(canonical)
    host = (parsed.hostname or "").lower().rstrip(".")
    if not canonical or parsed.username or parsed.password:
        raise ValueError("Only public HTTP(S) URLs are supported.")
    if host in {"localhost", "localhost.localdomain"} or host.endswith(".local"):
        raise ValueError("Local network URLs are not supported.")
    addresses = [host]
    if resolve_dns:
        try:
            addresses = [item[4][0] for item in socket.getaddrinfo(host, None)]
        except socket.gaierror as exc:
            raise ValueError("The discovered hostname could not be resolved.") from exc
    for raw in addresses:
        try:
            ip = ipaddress.ip_address(raw)
        except ValueError:
            continue
        if any(
            (
                ip.is_private,
                ip.is_loopback,
                ip.is_link_local,
                ip.is_reserved,
                ip.is_multicast,
                ip.is_unspecified,
            )
        ):
            raise ValueError("Private network URLs are not supported.")
    return canonical


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
def get_json_url(url, params=None, headers=None):
    merged = {
        "User-Agent": "CareerNavIQ/1.0 (+https://careernaviq.com)",
        "Accept": "application/json",
    }
    merged.update(headers or {})
    response = requests.get(url, params=params, headers=merged, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=2))
def get_html_url(url: str) -> tuple[str, str]:
    target = validate_public_url(url, resolve_dns=True)
    response = requests.get(
        target,
        headers={
            "User-Agent": "CareerNavIQ/1.0 (+https://careernaviq.com)",
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        },
        timeout=TIMEOUT,
        allow_redirects=True,
        stream=True,
    )
    response.raise_for_status()
    final_url = validate_public_url(response.url, resolve_dns=True)
    if "html" not in (response.headers.get("Content-Type") or "").lower():
        raise ValueError("The discovered URL did not return HTML.")
    chunks, size = [], 0
    for chunk in response.iter_content(chunk_size=65536):
        size += len(chunk)
        if size > MAX_PAGE_BYTES:
            raise ValueError("The discovered page is too large to parse safely.")
        chunks.append(chunk)
    return b"".join(chunks).decode(response.encoding or "utf-8", "replace"), final_url


def cached(key: str, loader, ttl: int = 21600):
    hit = get_json(key)
    if hit is not None:
        return hit
    data = loader()
    set_json(key, data, ttl)
    return data


def _walk(value):
    if isinstance(value, dict):
        job_type = value.get("@type")
        types = job_type if isinstance(job_type, list) else [job_type]
        if any(str(item or "").lower().endswith("jobposting") for item in types):
            yield value
        for key, child in value.items():
            if key != "@context":
                yield from _walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk(child)


def _location(item: dict) -> tuple[str, bool]:
    remote = str(item.get("jobLocationType") or "").upper() == "TELECOMMUTE"
    values = item.get("applicantLocationRequirements") if remote else item.get("jobLocation")
    values = values or []
    values = values if isinstance(values, list) else [values]
    parts = []
    for value in values:
        if not isinstance(value, dict):
            parts.append(clean_html(value))
            continue
        address = value.get("address") if isinstance(value.get("address"), dict) else value
        parts.append(
            str(value.get("name") or ", ".join(
                str(address.get(key))
                for key in ("addressLocality", "addressRegion", "postalCode", "addressCountry")
                if address.get(key)
            ))
        )
    text = "; ".join(dict.fromkeys(part for part in parts if part))
    return ((f"Remote — {text}" if text else "Remote") if remote else text), remote


def _salary(value) -> str:
    if not isinstance(value, dict):
        return clean_html(value)
    amount = value.get("value")
    if not isinstance(amount, dict):
        return " ".join(str(part) for part in (value.get("currency"), amount) if part)
    minimum, maximum, exact = amount.get("minValue"), amount.get("maxValue"), amount.get("value")
    number = (
        f"{minimum} - {maximum}"
        if minimum not in (None, "") and maximum not in (None, "")
        else str(exact if exact not in (None, "") else minimum or maximum or "")
    )
    return " ".join(str(part) for part in (value.get("currency"), number, amount.get("unitText")) if part)


def parse_jobposting_html(html: str, page_url: str) -> list[dict]:
    page_url = validate_public_url(page_url)
    ats = detect_ats(page_url)
    source = f"{ATS_LABELS[ats]} career page" if ats != "generic" else "Employer career page"
    rows = []
    for script in BeautifulSoup(html or "", "html.parser").find_all(
        "script", attrs={"type": "application/ld+json"}
    ):
        try:
            payload = json.loads(script.string or script.get_text("", strip=True))
        except (TypeError, json.JSONDecodeError):
            continue
        for item in _walk(payload):
            title = clean_html(item.get("title") or item.get("name"))
            description = clean_html(item.get("description"))
            if not title or not description:
                continue
            url = canonicalize_url(str(item.get("url") or page_url)) or page_url
            organization = item.get("hiringOrganization") or {}
            if isinstance(organization, list):
                organization = organization[0] if organization else {}
            company = clean_html(organization.get("name")) if isinstance(organization, dict) else ""
            if not company:
                host = (urlparse(url).hostname or "Employer").split(".")
                company = (host[-2] if len(host) > 1 else host[0]).replace("-", " ").title()
            location, remote = _location(item)
            employment = item.get("employmentType") or ""
            if isinstance(employment, list):
                employment = ", ".join(str(value) for value in employment if value)
            rows.append(
                {
                    "provider_key": stable_key(source, company, title, url),
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": description,
                    "url": url,
                    "source": source,
                    "posted_at": str(item.get("datePosted") or ""),
                    "salary": _salary(item.get("baseSalary")),
                    "employment_type": str(employment),
                    "remote": remote,
                }
            )
    return rows


def fetch_jobposting_rows(url: str) -> list[dict]:
    html, final_url = get_html_url(url)
    return parse_jobposting_html(html, final_url)


def _root_domain(url: str) -> str:
    parts = (urlparse(url).hostname or "").lower().split(".")
    return ".".join(parts[-2:]) if len(parts) > 1 else "".join(parts)


def _direct_rows(ats: str, url: str, query: str) -> list[dict]:
    from app.services import job_sources

    loaders = {
        "greenhouse": job_sources.greenhouse,
        "lever": job_sources.lever,
        "ashby": job_sources.ashby,
        "smartrecruiters": job_sources.smartrecruiters,
        "recruitee": job_sources.recruitee,
        "workable": job_sources.workable,
    }
    match = re.search(DIRECT_ATS[ats], url, re.I)
    board = match.group(1) if match else url
    return [row for row in loaders[ats](board) if job_sources.query_matches(row, query)]


def brave_jobs(query: str, location: str = "") -> list[dict]:
    if not settings.brave_search_api_key:
        raise RuntimeError("Brave web discovery requires BRAVE_SEARCH_API_KEY.")

    def load():
        location_term = f' "{location.strip()}"' if location.strip() else ""
        search_query = (
            f'"{query.strip()}" (jobs OR careers){location_term} '
            "-site:linkedin.com -site:indeed.com -site:glassdoor.com "
            "-site:ziprecruiter.com -site:monster.com"
        )
        payload = get_json_url(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": search_query, "count": 20, "country": "us", "search_lang": "en"},
            headers={"X-Subscription-Token": settings.brave_search_api_key},
        )
        candidates, seen = [], set()
        for result in ((payload.get("web") or {}).get("results") or [])[:12]:
            url = canonicalize_url(str(result.get("url") or ""))
            if not url or url in seen or _root_domain(url) in BLOCKED_DOMAINS:
                continue
            seen.add(url)
            candidates.append((detect_ats(url), url))

        rows, boards, pages = [], set(), []
        for ats, url in candidates:
            if ats in DIRECT_ATS:
                match = re.search(DIRECT_ATS[ats], url, re.I)
                boards.add((ats, match.group(1) if match else url))
            else:
                pages.append(url)
        for ats, board in boards:
            try:
                rows.extend(_direct_rows(ats, board, query))
            except Exception:
                pass
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(fetch_jobposting_rows, url) for url in pages[:8]]
            for future in as_completed(futures):
                try:
                    rows.extend(future.result())
                except Exception:
                    pass
        from app.services import job_sources
        return job_sources.dedupe(rows)

    return cached(
        f"jobs:brave:v1:{query.lower()}:{(location or 'nationwide').lower()}",
        load,
        21600,
    )
