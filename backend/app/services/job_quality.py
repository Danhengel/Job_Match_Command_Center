from __future__ import annotations

import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse


DIRECT_SOURCE_MARKERS = (
    "career page",
    "greenhouse",
    "lever",
    "ashby",
    "smartrecruiters",
    "recruitee",
    "workable",
    "workday",
    "icims",
    "taleo",
    "oracle",
    "successfactors",
    "dayforce",
    "paylocity",
    "jobvite",
    "bamboohr",
    "paycom",
    "teamtailor",
    "personio",
)
OFFICIAL_SOURCE_MARKERS = (
    "usajobs",
    "governmentjobs",
    "careeronestop",
    "nlx",
)
MAJOR_BOARD_MARKERS = (
    "linkedin",
    "indeed",
    "glassdoor",
    "ziprecruiter",
    "dice",
    "wellfound",
    "efinancialcareers",
)
AGGREGATOR_MARKERS = (
    "jobspipe",
    "jsearch",
    "adzuna",
    "jooble",
    "careerbuilder",
    "monster",
    "simplyhired",
)
RECRUITER_MARKERS = (
    "placement agency",
    "recruiter",
    "staffing",
)
REMOTE_BOARD_MARKERS = (
    "remotive",
    "remote ok",
    "jobicy",
    "we work remotely",
    "remote.co",
)

CORPORATE_SUFFIXES = {
    "inc",
    "incorporated",
    "llc",
    "ltd",
    "limited",
    "corp",
    "corporation",
    "plc",
    "co",
    "company",
}

STATE_NAMES = {
    "alabama": "al", "alaska": "ak", "arizona": "az", "arkansas": "ar",
    "california": "ca", "colorado": "co", "connecticut": "ct", "delaware": "de",
    "florida": "fl", "georgia": "ga", "hawaii": "hi", "idaho": "id",
    "illinois": "il", "indiana": "in", "iowa": "ia", "kansas": "ks",
    "kentucky": "ky", "louisiana": "la", "maine": "me", "maryland": "md",
    "massachusetts": "ma", "michigan": "mi", "minnesota": "mn", "mississippi": "ms",
    "missouri": "mo", "montana": "mt", "nebraska": "ne", "nevada": "nv",
    "new hampshire": "nh", "new jersey": "nj", "new mexico": "nm", "new york": "ny",
    "north carolina": "nc", "north dakota": "nd", "ohio": "oh", "oklahoma": "ok",
    "oregon": "or", "pennsylvania": "pa", "rhode island": "ri", "south carolina": "sc",
    "south dakota": "sd", "tennessee": "tn", "texas": "tx", "utah": "ut",
    "vermont": "vt", "virginia": "va", "washington": "wa", "west virginia": "wv",
    "wisconsin": "wi", "wyoming": "wy", "district of columbia": "dc",
}


def _words(value: str) -> list[str]:
    return [part for part in re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).split() if part]


def normalize_company(value: str) -> str:
    parts = _words(value)
    while parts and parts[-1] in CORPORATE_SUFFIXES:
        parts.pop()
    return " ".join(parts)


def normalize_title(value: str) -> str:
    text = (value or "").lower()
    text = re.sub(r"\bvice[ -]?president\b", "vp", text)
    text = re.sub(r"\bsenior\b", "sr", text)
    text = re.sub(r"\bjunior\b", "jr", text)
    return " ".join(_words(text))


def normalize_location(value: str) -> str:
    text = (value or "").lower().strip()
    if "remote" in text or "work from home" in text:
        return "remote"
    text = re.sub(r"\b(united states of america|united states|usa|u s a|us)\b", " ", text)
    for name, abbreviation in STATE_NAMES.items():
        text = re.sub(rf"\b{re.escape(name)}\b", abbreviation, text)
    return " ".join(_words(text)) or "unknown"


def dedupe_key(row: dict) -> str:
    return "|".join(
        (
            normalize_company(str(row.get("company") or "")),
            normalize_title(str(row.get("title") or "")),
            normalize_location(str(row.get("location") or "")),
        )
    )


def source_quality(source: str) -> int:
    value = (source or "").lower()
    if any(marker in value for marker in DIRECT_SOURCE_MARKERS):
        return 100
    if any(marker in value for marker in OFFICIAL_SOURCE_MARKERS):
        return 96
    if any(marker in value for marker in MAJOR_BOARD_MARKERS):
        return 88
    if any(marker in value for marker in RECRUITER_MARKERS):
        return 84
    if any(marker in value for marker in AGGREGATOR_MARKERS):
        return 80
    if any(marker in value for marker in REMOTE_BOARD_MARKERS):
        return 74
    return 78


def parse_posted_at(value: str) -> datetime | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    if raw.isdigit():
        try:
            timestamp = float(raw)
            if timestamp > 10_000_000_000:
                timestamp /= 1000
            return datetime.fromtimestamp(timestamp, tz=timezone.utc).replace(tzinfo=None)
        except (OSError, OverflowError, ValueError):
            return None
    cleaned = raw.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(cleaned)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError:
        pass
    try:
        parsed = parsedate_to_datetime(raw)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except (TypeError, ValueError, OverflowError):
        return None


def freshness_points(posted_at: str, now: datetime | None = None) -> int:
    posted = parse_posted_at(posted_at)
    if not posted:
        return 0
    age_days = max(0, ((now or datetime.utcnow()) - posted).days)
    if age_days <= 2:
        return 10
    if age_days <= 7:
        return 8
    if age_days <= 14:
        return 6
    if age_days <= 30:
        return 3
    if age_days <= 60:
        return 0
    if age_days <= 90:
        return -2
    return -4


def row_quality(row: dict) -> int:
    description = str(row.get("description") or "")
    completeness = min(len(description), 2500) // 50
    if row.get("salary"):
        completeness += 5
    if row.get("employment_type"):
        completeness += 2
    if row.get("url"):
        completeness += 3
    return (
        source_quality(str(row.get("source") or "")) * 10
        + freshness_points(str(row.get("posted_at") or "")) * 8
        + completeness
    )


def dedupe_rows(rows: list[dict]) -> list[dict]:
    best: dict[str, tuple[int, dict]] = {}
    for row in rows or []:
        if not row.get("title") or not row.get("company"):
            continue
        key = dedupe_key(row)
        quality = row_quality(row)
        current = best.get(key)
        if current is None or quality > current[0]:
            best[key] = (quality, row)
    return [value[1] for value in best.values()]


def ranking_score(match_score: int | float, source: str, posted_at: str, verification_status: str = "") -> float:
    score = float(match_score or 0)
    score += (source_quality(source) - 75) / 10.0
    score += freshness_points(posted_at) * 0.45
    status = (verification_status or "").lower()
    if status == "open":
        score += 1.0
    elif status in {"closed", "invalid_url"}:
        score -= 100.0
    elif status in {"unknown", "inaccessible"}:
        score -= 0.5
    return round(score, 2)


def enrich_serialized_result(item: dict, verification_status: str = "") -> dict:
    job = item.get("job") or {}
    match = item.get("match") or {}
    source = str(job.get("source") or "")
    posted_at = str(job.get("posted_at") or "")
    rank = ranking_score(match.get("score", 0), source, posted_at, verification_status)
    item["ranking"] = {
        "score": rank,
        "source_quality": source_quality(source),
        "freshness_points": freshness_points(posted_at),
        "verification_status": verification_status or "unverified",
    }
    return item


def rank_serialized_results(items: list[dict]) -> list[dict]:
    enriched = [enrich_serialized_result(item) for item in items or []]
    return sorted(
        enriched,
        key=lambda item: (
            bool(item.get("target_company", False)),
            float((item.get("ranking") or {}).get("score", 0)),
            float((item.get("match") or {}).get("score", 0)),
        ),
        reverse=True,
    )


def source_domain(url: str) -> str:
    try:
        return (urlparse(url or "").hostname or "").lower()
    except ValueError:
        return ""
