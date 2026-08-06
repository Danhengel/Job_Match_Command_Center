from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

import requests
from bs4 import BeautifulSoup
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.job import Job
from app.services.web_discovery import validate_public_url


TIMEOUT = 15
MAX_BODY_BYTES = 750_000
MAX_WORKERS = 5
CLOSED_STATUS_CODES = {404, 410}
INACCESSIBLE_STATUS_CODES = {401, 403, 429}
CLOSED_MARKERS = (
    "this job is no longer available",
    "job is no longer available",
    "position is no longer available",
    "position no longer available",
    "this position has been filled",
    "job posting has expired",
    "this job has expired",
    "job has been removed",
    "job not found",
    "no longer accepting applications",
)


def classify_job_response(status_code: int, text: str = "") -> tuple[str, str]:
    if status_code in CLOSED_STATUS_CODES:
        return "closed", f"HTTP {status_code}"
    if status_code in INACCESSIBLE_STATUS_CODES:
        return "inaccessible", f"HTTP {status_code}"
    if status_code >= 500:
        return "unknown", f"HTTP {status_code}"
    if status_code < 200 or status_code >= 400:
        return "unknown", f"HTTP {status_code}"

    normalized = re.sub(r"\s+", " ", (text or "").lower()).strip()
    for marker in CLOSED_MARKERS:
        if marker in normalized:
            return "closed", marker
    return "open", "Page is reachable"


def _response_text(response: requests.Response) -> str:
    content_type = (response.headers.get("Content-Type") or "").lower()
    if "html" not in content_type:
        return ""
    chunks = []
    size = 0
    for chunk in response.iter_content(chunk_size=65536):
        size += len(chunk)
        if size > MAX_BODY_BYTES:
            break
        chunks.append(chunk)
    html = b"".join(chunks).decode(response.encoding or "utf-8", "replace")
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    return f"{title} {soup.get_text(' ', strip=True)}"[:300_000]


def verify_job_url(url: str) -> dict:
    try:
        target = validate_public_url(url, resolve_dns=True)
    except Exception as exc:
        return {
            "status": "invalid_url",
            "reason": str(exc),
            "final_url": "",
        }

    try:
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
        final_url = validate_public_url(response.url, resolve_dns=True)
        text = _response_text(response) if response.status_code < 400 else ""
        status, reason = classify_job_response(response.status_code, text)
        return {
            "status": status,
            "reason": reason,
            "final_url": final_url,
        }
    except requests.RequestException as exc:
        return {
            "status": "unknown",
            "reason": str(exc),
            "final_url": target,
        }
    except Exception as exc:
        return {
            "status": "unknown",
            "reason": str(exc),
            "final_url": target,
        }


def verify_stale_jobs(
    db: Session,
    limit: int = 25,
    min_age_days: int = 14,
    recheck_hours: int = 24,
) -> dict:
    now = datetime.utcnow()
    stale_before = now - timedelta(days=min_age_days)
    recheck_before = now - timedelta(hours=recheck_hours)
    jobs = (
        db.query(Job)
        .filter(
            Job.active.is_(True),
            Job.last_seen <= stale_before,
            or_(Job.verified_at.is_(None), Job.verified_at <= recheck_before),
        )
        .order_by(Job.last_seen.asc())
        .limit(max(1, min(limit, 100)))
        .all()
    )

    counts = {
        "checked": 0,
        "open": 0,
        "closed": 0,
        "inaccessible": 0,
        "unknown": 0,
        "invalid_url": 0,
    }
    futures = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for job in jobs:
            futures[executor.submit(verify_job_url, job.url)] = job
        for future in as_completed(futures):
            job = futures[future]
            result = future.result()
            status = result["status"]
            counts["checked"] += 1
            counts[status] = counts.get(status, 0) + 1
            job.verified_at = now
            job.verification_status = status
            if result.get("final_url"):
                job.url = result["final_url"]
            if status in {"closed", "invalid_url"}:
                job.active = False
                job.closed_at = now

    db.commit()
    return counts


def freshness_stats(db: Session) -> dict:
    rows = db.query(Job.verification_status, Job.active).all()
    statuses: dict[str, int] = {}
    active = 0
    for status, is_active in rows:
        key = status or "unverified"
        statuses[key] = statuses.get(key, 0) + 1
        if is_active:
            active += 1
    last_verified = db.query(Job.verified_at).filter(
        Job.verified_at.is_not(None)
    ).order_by(Job.verified_at.desc()).first()
    return {
        "total_jobs": len(rows),
        "active_jobs": active,
        "inactive_jobs": len(rows) - active,
        "verification_status": statuses,
        "last_verified_at": (
            last_verified[0].isoformat() if last_verified and last_verified[0] else None
        ),
    }
