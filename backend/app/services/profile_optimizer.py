from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class RoleFamily:
    key: str
    label: str
    indicators: dict[str, int]
    target_titles: list[str]
    keywords: list[str]
    exclusions: list[str]


ROLE_FAMILIES = [
    RoleFamily(
        key="saas_sales",
        label="SaaS / B2B Sales",
        indicators={
            "account executive": 6,
            "saas": 5,
            "b2b sales": 5,
            "quota": 4,
            "territory management": 4,
            "pipeline management": 3,
            "prospecting": 3,
            "solution selling": 3,
            "business development": 3,
            "upselling": 2,
            "contract negotiation": 2,
            "salesforce": 2,
            "closing deals": 2,
            "client acquisition": 2,
        },
        target_titles=[
            "Senior Account Executive",
            "Enterprise Account Executive",
            "Strategic Account Executive",
            "Regional Account Executive",
            "Territory Account Executive",
            "Account Director",
            "Strategic Account Manager",
            "Business Development Manager",
            "Business Development Director",
            "Regional Sales Manager",
            "Sales Director",
        ],
        keywords=[
            "SaaS sales",
            "B2B sales",
            "enterprise sales",
            "full-cycle sales",
            "quota attainment",
            "territory management",
            "pipeline management",
            "business development",
            "prospecting",
            "lead generation",
            "solution selling",
            "consultative selling",
            "account management",
            "account expansion",
            "upselling",
            "contract negotiation",
            "customer retention",
            "strategic account planning",
            "sales forecasting",
            "Salesforce",
            "ZoomInfo",
            "LinkedIn Sales Navigator",
            "C-level executives",
            "customer success",
        ],
        exclusions=[
            "entry-level",
            "sales development representative",
            "SDR",
            "BDR",
            "door-to-door",
            "commission only",
            "insurance agent",
            "retail sales",
            "automotive sales",
            "real estate agent",
            "part-time",
        ],
    ),
    RoleFamily(
        key="lending_credit",
        label="Commercial Lending / Credit",
        indicators={
            "construction lending": 6,
            "commercial lending": 5,
            "loan servicing": 5,
            "credit risk": 4,
            "underwriting": 4,
            "loan operations": 4,
            "draw administration": 4,
            "portfolio management": 3,
            "disbursement": 3,
            "sba": 2,
            "lihtc": 2,
            "c-pace": 2,
        },
        target_titles=[
            "Director, Construction Loan Administration",
            "Vice President, Construction Loan Administration",
            "Director, Commercial Loan Operations",
            "Director, Commercial Loan Servicing",
            "Vice President, Loan Operations",
            "Director, CRE Loan Operations",
            "Director, Credit Administration",
            "Director, Portfolio Management",
            "Head of Construction Loan Servicing",
            "Director, Construction Finance Operations",
        ],
        keywords=[
            "construction lending",
            "commercial lending",
            "loan operations",
            "loan servicing",
            "draw administration",
            "disbursement",
            "credit risk",
            "underwriting",
            "portfolio management",
            "credit administration",
            "commercial real estate",
            "CRE",
            "SBA",
            "LIHTC",
            "C-PACE",
            "audit readiness",
            "controls",
            "covenant management",
            "workouts",
            "vendor management",
        ],
        exclusions=[
            "consumer loan officer",
            "mortgage loan originator",
            "teller",
            "branch banker",
            "entry-level",
            "commission only",
            "part-time",
        ],
    ),
    RoleFamily(
        key="operations_program",
        label="Operations / Program Leadership",
        indicators={
            "operations": 4,
            "program management": 4,
            "process improvement": 4,
            "workflow": 3,
            "automation": 3,
            "vendor management": 3,
            "stakeholder management": 3,
            "governance": 3,
            "project management": 2,
            "implementation": 2,
        },
        target_titles=[
            "Director of Operations",
            "Senior Director of Operations",
            "Vice President of Operations",
            "Director of Program Management",
            "Program Director",
            "Director of Business Operations",
            "Director of Process Improvement",
            "Director of Operational Excellence",
            "PMO Director",
        ],
        keywords=[
            "operations",
            "program management",
            "process improvement",
            "workflow design",
            "automation",
            "vendor management",
            "stakeholder management",
            "governance",
            "project management",
            "implementation",
            "SOPs",
            "reporting",
            "controls",
            "cross-functional collaboration",
        ],
        exclusions=["entry-level", "coordinator", "assistant", "part-time", "commission only"],
    ),
    RoleFamily(
        key="customer_success",
        label="Customer Success / Account Leadership",
        indicators={
            "customer success": 5,
            "customer retention": 4,
            "account management": 4,
            "client relationships": 3,
            "renewals": 3,
            "onboarding": 3,
            "implementation": 2,
            "upselling": 2,
        },
        target_titles=[
            "Customer Success Director",
            "Director of Customer Success",
            "Strategic Account Director",
            "Enterprise Account Director",
            "Senior Customer Success Manager",
            "Director of Account Management",
        ],
        keywords=[
            "customer success",
            "customer retention",
            "account management",
            "renewals",
            "upselling",
            "strategic accounts",
            "client relationships",
            "onboarding",
            "implementation",
            "cross-functional collaboration",
        ],
        exclusions=["customer support representative", "call center", "entry-level", "part-time"],
    ),
]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip().lower()


def _contains(text: str, phrase: str) -> bool:
    return phrase.lower() in text


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = value.strip().lower()
        if key and key not in seen:
            seen.add(key)
            result.append(value.strip())
    return result


def _years_experience(text: str) -> int | None:
    candidates = [int(value) for value in re.findall(r"\b(\d{1,2})\+?\s+years?\b", text)]
    return max(candidates) if candidates else None


def _family_scores(text: str) -> list[tuple[RoleFamily, int, list[str]]]:
    scored: list[tuple[RoleFamily, int, list[str]]] = []
    for family in ROLE_FAMILIES:
        evidence = [phrase for phrase in family.indicators if _contains(text, phrase)]
        score = sum(family.indicators[phrase] for phrase in evidence)
        scored.append((family, score, evidence))
    return sorted(scored, key=lambda item: item[1], reverse=True)


def _grounded_keywords(text: str, family: RoleFamily, current_keywords: list[str]) -> list[str]:
    grounded = [keyword for keyword in family.keywords if _contains(text, keyword)]
    grounded.extend(keyword for keyword in current_keywords if _contains(text, keyword.lower()))
    return _dedupe(grounded)[:24]


def _sales_titles(text: str, years: int | None, family: RoleFamily) -> list[str]:
    titles = list(family.target_titles)
    # Resume evidence can support senior individual-contributor sales roles without
    # automatically claiming people-management experience.
    has_management = any(
        phrase in text
        for phrase in ["managed a team", "managed team", "direct reports", "sales manager", "sales director", "led a team"]
    )
    if family.key == "saas_sales" and not has_management:
        core = [title for title in titles if title not in {"Regional Sales Manager", "Sales Director"}]
        stretch = [title for title in titles if title in {"Regional Sales Manager", "Sales Director"}]
        titles = core + (stretch if (years or 0) >= 12 else [])
    return titles[:10]


def optimize_profile_from_resume(
    resume_text: str,
    *,
    current_titles: list[str] | None = None,
    current_keywords: list[str] | None = None,
    current_exclusions: list[str] | None = None,
    remote_preferred: bool = True,
    hybrid_preferred: bool = True,
) -> dict:
    text = _normalize(resume_text)
    if len(text) < 80:
        raise ValueError("The primary résumé does not contain enough readable text to optimize this profile.")

    current_titles = current_titles or []
    current_keywords = current_keywords or []
    current_exclusions = current_exclusions or []
    scores = _family_scores(text)
    family, score, evidence = scores[0]
    second_score = scores[1][1] if len(scores) > 1 else 0

    if score < 4:
        return {
            "role_family": "General professional",
            "role_family_key": "general",
            "confidence": "low",
            "confidence_score": score,
            "recommended_target_titles": _dedupe(current_titles)[:10],
            "recommended_priority_keywords": _dedupe(current_keywords)[:24],
            "recommended_exclusion_keywords": _dedupe(current_exclusions)[:16],
            "recommended_remote_preferred": remote_preferred,
            "recommended_hybrid_preferred": hybrid_preferred,
            "resume_evidence": [],
            "reasoning": "CareerNavIQ could not identify one dominant role family with enough résumé evidence, so existing profile criteria were preserved.",
            "search_ready": bool(current_titles and current_keywords),
        }

    years = _years_experience(text)
    titles = _sales_titles(text, years, family)
    keywords = _grounded_keywords(text, family, current_keywords)
    exclusions = _dedupe(family.exclusions + current_exclusions)[:16]

    # An explicit remote role in the résumé is useful evidence; lack of that phrase
    # should not erase an existing user preference.
    resume_has_remote = bool(re.search(r"\bremote\b", text))
    suggested_remote = remote_preferred or resume_has_remote

    margin = score - second_score
    confidence = "high" if score >= 12 and margin >= 4 else "medium"
    evidence_labels = _dedupe(evidence)[:12]
    years_detail = f" with {years}+ years of stated experience" if years else ""
    reasoning = (
        f"The primary résumé most strongly supports {family.label}{years_detail}. "
        f"Recommendations are based on résumé evidence such as {', '.join(evidence_labels[:6])}. "
        "Location, radius, and compensation are intentionally preserved because those are search preferences, not résumé facts."
    )

    return {
        "role_family": family.label,
        "role_family_key": family.key,
        "confidence": confidence,
        "confidence_score": score,
        "recommended_target_titles": titles,
        "recommended_priority_keywords": keywords,
        "recommended_exclusion_keywords": exclusions,
        "recommended_remote_preferred": suggested_remote,
        "recommended_hybrid_preferred": hybrid_preferred,
        "resume_evidence": evidence_labels,
        "reasoning": reasoning,
        "search_ready": len(titles) >= 3 and len(keywords) >= 5,
    }
