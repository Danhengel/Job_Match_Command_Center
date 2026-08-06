from __future__ import annotations

import re


BASE_WEIGHTS = {
    "title_score": 0.35,
    "keyword_score": 0.30,
    "location_score": 0.20,
    "resume_score": 0.15,
}


def tokens(value):
    return {
        item
        for item in re.findall(
            r"[a-z0-9+#.-]{3,}",
            (value or "").lower(),
        )
    }


def _normalized_weighted_score(components: dict[str, int]) -> int:
    weighted_total = sum(
        components[name] * BASE_WEIGHTS[name]
        for name in components
    )
    available_weight = sum(
        BASE_WEIGHTS[name]
        for name in components
    )
    if not available_weight:
        return 0
    return round(weighted_total / available_weight)


def match_job(job, profile, resume_text=""):
    hay = f"{job.title} {job.description}".lower()
    title_tokens = tokens(job.title)
    target_titles = profile.target_titles or []
    target_scores = []

    for target in target_titles:
        target_tokens = tokens(target)
        if not target_tokens:
            continue
        overlap = len(title_tokens & target_tokens) / len(target_tokens)
        exact = (
            1
            if target.lower() in job.title.lower()
            or job.title.lower() in target.lower()
            else 0
        )
        target_scores.append(
            min(100, round(overlap * 70 + exact * 35))
        )

    title_score = max(target_scores or [0])

    priority_keywords = profile.priority_keywords or []
    matched = [
        keyword
        for keyword in priority_keywords
        if keyword.lower() in hay
    ]
    missing = [
        keyword
        for keyword in priority_keywords
        if keyword.lower() not in hay
    ]
    keyword_score = min(
        100,
        round(
            len(matched)
            / max(1, len(priority_keywords))
            * 100
        ),
    )

    location_text = (job.location or "").lower()
    city = (profile.home_location or "").split(",")[0].lower()

    if job.remote and profile.remote_preferred:
        location_score = 100
    elif city and city in location_text:
        location_score = 100
    elif profile.hybrid_preferred and any(
        value and value in location_text
        for value in ["hybrid", city]
    ):
        location_score = 80
    else:
        location_score = 25

    resume_tokens = tokens(resume_text)
    job_tokens = tokens(job.description)
    overlap = len(resume_tokens & job_tokens)
    resume_score = min(
        100,
        round(
            overlap
            / max(1, min(len(job_tokens), 120))
            * 100
        ),
    )

    components: dict[str, int] = {}

    if target_titles:
        components["title_score"] = title_score
    if priority_keywords:
        components["keyword_score"] = keyword_score
    if (
        job.location
        or job.remote
    ) and (
        profile.home_location
        or profile.remote_preferred
        or profile.hybrid_preferred
    ):
        components["location_score"] = location_score
    if resume_tokens and job_tokens:
        components["resume_score"] = resume_score

    exclusion_hits = [
        word
        for word in profile.exclusion_keywords or []
        if word.lower() in hay
    ]
    concerns = list(exclusion_hits)

    if (
        "location_score" in components
        and location_score < 50
    ):
        concerns.append("Location fit needs review")
    if not job.salary:
        concerns.append("Compensation not listed")

    score = _normalized_weighted_score(components)
    score -= len(exclusion_hits) * 4
    score = max(0, min(100, score))

    available_signals = ", ".join(
        name.removesuffix("_score").replace("_", " ")
        for name in components
    ) or "none"
    explanation = (
        f"Title alignment {title_score}%, priority-keyword coverage "
        f"{keyword_score}%, location fit {location_score}%, and "
        f"résumé-language overlap {resume_score}%. Available signals "
        f"({available_signals}) were reweighted to 100%."
    )

    return {
        "score": score,
        "title_score": title_score,
        "keyword_score": keyword_score,
        "location_score": location_score,
        "resume_score": resume_score,
        "matched_keywords": matched[:15],
        "missing_keywords": missing[:10],
        "concerns": concerns[:6],
        "explanation": explanation,
    }
