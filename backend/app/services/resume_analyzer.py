from __future__ import annotations
import re
from collections import Counter

ACTION_VERBS = {
    "led","managed","directed","built","created","implemented","developed","oversaw",
    "improved","reduced","increased","delivered","launched","designed","established",
    "transformed","streamlined","negotiated","administered","executed","coordinated"
}
LEADERSHIP_TERMS = {
    "leadership","team","direct reports","stakeholders","executive","board","strategy",
    "governance","cross-functional","vendor management","program management"
}
RISK_TERMS = {
    "risk","compliance","audit","controls","credit","underwriting","covenant","portfolio",
    "regulatory","policy","quality assurance"
}
OPERATIONS_TERMS = {
    "operations","process","workflow","servicing","administration","disbursement",
    "construction draws","inspection","closing","documentation","automation"
}

def contains(text: str, phrase: str) -> bool:
    return phrase.lower() in text.lower()

def analyze_resume(text: str, priority_keywords: list[str], target_titles: list[str]) -> dict:
    clean = re.sub(r"\s+", " ", text or "").strip()
    lower = clean.lower()
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.-]{2,}", lower)
    word_count = len(words)

    matched_keywords = [k for k in priority_keywords if contains(lower, k)]
    gaps = [k for k in priority_keywords if not contains(lower, k)]

    metric_patterns = [
        r"\$\s?\d+(?:\.\d+)?\s?(?:million|billion|m|b|k)?",
        r"\b\d+(?:\.\d+)?%",
        r"\b\d{2,}(?:,\d{3})*\s+(?:projects|loans|facilities|employees|requests|transactions|clients|accounts)\b",
        r"\b\d+(?:\.\d+)?\s?(?:million|billion)\b",
    ]
    metrics = []
    for pattern in metric_patterns:
        metrics.extend(re.findall(pattern, lower, flags=re.IGNORECASE))
    metrics = list(dict.fromkeys(m.strip() for m in metrics))[:15]

    action_count = sum(1 for w in words if w in ACTION_VERBS)
    leadership_hits = [x for x in LEADERSHIP_TERMS if contains(lower, x)]
    risk_hits = [x for x in RISK_TERMS if contains(lower, x)]
    operations_hits = [x for x in OPERATIONS_TERMS if contains(lower, x)]
    title_hits = [t for t in target_titles if any(token in lower for token in re.findall(r"[a-z]{4,}", t.lower()))]

    strengths = []
    if len(metrics) >= 4: strengths.append("Strong use of quantified accomplishments")
    if action_count >= 8: strengths.append("Action-oriented leadership language")
    if leadership_hits: strengths.append("Leadership and stakeholder management evidence")
    if risk_hits: strengths.append("Risk, controls, and governance evidence")
    if operations_hits: strengths.append("Operations and process-improvement depth")
    if matched_keywords: strengths.append(f"Matches {len(matched_keywords)} profile priority keywords")
    if 450 <= word_count <= 1100: strengths.append("Résumé length is appropriate for an experienced professional")
    elif word_count > 1100: strengths.append("Substantial career detail is available for tailoring")

    score = 30
    score += min(22, len(matched_keywords) * 3)
    score += min(15, len(metrics) * 3)
    score += min(12, action_count)
    score += min(8, len(leadership_hits) * 2)
    score += min(7, len(risk_hits))
    score += min(6, len(operations_hits))
    if word_count < 250: score -= 15
    if not target_titles: score -= 5
    score = max(0, min(100, score))

    if not strengths:
        strengths.append("Readable résumé text was extracted successfully")
    prioritized_gaps = gaps[:8]
    if len(metrics) < 3:
        prioritized_gaps.insert(0, "Add more quantified outcomes and portfolio/team metrics")
    if action_count < 6:
        prioritized_gaps.insert(0, "Use more action-led accomplishment bullets")
    if not leadership_hits:
        prioritized_gaps.append("Strengthen leadership and stakeholder-management evidence")

    summary = (
        f"Evidence-based analysis found {len(matched_keywords)} of {len(priority_keywords)} "
        f"priority keywords, {len(metrics)} measurable results, and {action_count} action verbs. "
        f"The score reflects résumé evidence and profile alignment; it is not a hiring prediction."
    )
    return {
        "score": score,
        "strengths": strengths[:8],
        "gaps": list(dict.fromkeys(prioritized_gaps))[:10],
        "metrics_found": metrics,
        "summary": summary,
        "matched_keywords": matched_keywords,
    }
