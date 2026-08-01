from __future__ import annotations
import re
from collections import Counter


STOPWORDS = {
    "and", "the", "with", "for", "that", "from", "this", "will", "are",
    "our", "your", "you", "job", "role", "team", "work", "have", "has",
    "into", "within", "about", "their", "they", "all", "not", "but",
    "who", "its", "can", "may", "more", "than", "such", "using", "use",
    "years", "experience", "required", "preferred", "responsibilities",
}


def _terms(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-z0-9+#.-]{3,}", (text or "").lower())
        if token not in STOPWORDS
    ]


def _keyword_phrases(description: str, limit: int = 24) -> list[str]:
    text = (description or "").lower()
    phrases = []

    known = [
        "construction lending",
        "construction loan administration",
        "commercial real estate",
        "commercial lending",
        "loan servicing",
        "loan operations",
        "credit administration",
        "credit risk",
        "portfolio management",
        "asset management",
        "risk management",
        "process improvement",
        "vendor management",
        "team leadership",
        "regulatory compliance",
        "audit readiness",
        "construction draws",
        "draw administration",
        "investor reporting",
        "default management",
        "workouts",
        "sba",
        "lihtc",
    ]

    for phrase in known:
        if phrase in text:
            phrases.append(phrase)

    counts = Counter(_terms(description))
    phrases.extend([term for term, _ in counts.most_common(limit)])

    return list(dict.fromkeys(phrases))[:limit]


def _resume_lines(resume_text: str) -> list[str]:
    raw = re.split(r"[\r\n]+|(?<=[.!?])\s+", resume_text or "")
    lines = []
    for line in raw:
        clean = re.sub(r"\s+", " ", line).strip(" -•\t")
        if 35 <= len(clean) <= 420:
            lines.append(clean)
    return list(dict.fromkeys(lines))


def tailor_resume(
    resume_text: str,
    job_title: str,
    company: str,
    job_description: str,
    profile_keywords: list[str] | None = None,
) -> dict:
    keywords = _keyword_phrases(job_description)
    resume_lower = (resume_text or "").lower()

    matched = [
        keyword
        for keyword in keywords
        if keyword.lower() in resume_lower
    ]
    missing = [
        keyword
        for keyword in keywords
        if keyword.lower() not in resume_lower
    ]

    lines = _resume_lines(resume_text)
    scored_lines = []

    for line in lines:
        line_lower = line.lower()
        score = sum(3 for keyword in matched if keyword in line_lower)
        score += sum(
            1
            for token in _terms(job_description)
            if token in line_lower
        )
        if re.search(r"\$?\d[\d,.]*%?|\b\d+\b", line):
            score += 3
        if any(
            word in line_lower
            for word in [
                "led", "managed", "directed", "built", "created",
                "oversaw", "implemented", "developed", "reduced",
                "improved", "launched",
            ]
        ):
            score += 2
        scored_lines.append((score, line))

    scored_lines.sort(key=lambda item: item[0], reverse=True)
    evidence = [line for score, line in scored_lines if score > 0][:10]
    if not evidence:
        evidence = lines[:8]

    profile_keywords = profile_keywords or []
    strengths = list(dict.fromkeys(matched + profile_keywords))[:8]

    summary_parts = [
        f"Senior operations and lending professional aligned to the {job_title} opportunity at {company}.",
    ]
    if strengths:
        summary_parts.append(
            "Relevant experience includes "
            + ", ".join(strengths[:6])
            + "."
        )
    summary_parts.append(
        "This draft is evidence-preserving and uses only experience found in the uploaded resume."
    )
    summary = " ".join(summary_parts)

    recommendations = []
    for keyword in missing[:8]:
        recommendations.append(
            f"Confirm whether you have evidence for '{keyword}' before adding it."
        )
    if not any(re.search(r"\$?\d[\d,.]*%?|\b\d+\b", line) for line in evidence):
        recommendations.append(
            "Add verified portfolio, volume, team-size, cycle-time, or risk metrics."
        )
    recommendations.append(
        "Review every statement before use; do not add skills or results you cannot verify."
    )

    coverage = len(matched) / max(1, len(keywords))
    evidence_bonus = min(25, len(evidence) * 3)
    ats_score = min(100, round(coverage * 75 + evidence_bonus))

    sections = [
        summary,
        "",
        "SELECTED RELEVANT EVIDENCE",
    ]
    sections.extend([f"- {line}" for line in evidence])
    sections.extend([
        "",
        "MATCHED JOB KEYWORDS",
        ", ".join(matched) if matched else "No exact keyword matches detected.",
        "",
        "KEYWORDS REQUIRING VERIFICATION",
        ", ".join(missing[:12]) if missing else "None identified.",
    ])

    return {
        "ats_score": ats_score,
        "professional_summary": summary,
        "tailored_text": "\n".join(sections),
        "selected_evidence": evidence,
        "matched_keywords": matched,
        "missing_keywords": missing[:15],
        "recommendations": recommendations,
    }


def generate_cover_letter(
    candidate_name: str,
    job_title: str,
    company: str,
    location: str,
    evidence: list[str],
    matched_keywords: list[str],
) -> str:
    lead = (
        f"Dear Hiring Team,\n\n"
        f"I am writing to express my interest in the {job_title} position at {company}. "
        f"My background aligns with the role's focus on "
        f"{', '.join(matched_keywords[:5]) if matched_keywords else 'lending operations and leadership'}."
    )

    evidence_text = ""
    if evidence:
        evidence_text = (
            "\n\nSelected experience relevant to this opportunity includes:\n"
            + "\n".join(f"- {item}" for item in evidence[:4])
        )

    close = (
        f"\n\nI would welcome the opportunity to discuss how this experience could support "
        f"{company}'s objectives"
        + (f" in {location}" if location else "")
        + f". Thank you for your consideration.\n\nSincerely,\n{candidate_name}"
    )

    return lead + evidence_text + close
