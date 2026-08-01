from __future__ import annotations
from datetime import datetime

from app.models.application import Application
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile


def build_salary_plan(profile: CareerProfile, job: Job, match: JobMatch | None, request):
    saved_target = getattr(profile, "salary_target", None)
    saved_minimum = getattr(profile, "salary_min", None)

    target_base = request.target_base or saved_target
    minimum_base = request.minimum_base or saved_minimum
    bonus_pct = request.target_bonus_pct

    if bonus_pct is None:
        title = (job.title or "").lower()
        if any(x in title for x in ["vice president", "vp", "director", "head", "managing director"]):
            bonus_pct = 25
        elif any(x in title for x in ["manager", "senior manager"]):
            bonus_pct = 15
        else:
            bonus_pct = 10

    total_comp_target = None
    if target_base:
        total_comp_target = round(target_base * (1 + bonus_pct / 100))

    rationale = [
        "The saved career-profile target is used as the primary planning input.",
        "The role title is used only to select a planning bonus percentage; this is not live market salary data.",
        "Confirm the employer's actual range, incentive plan, equity, retirement, and benefits before negotiating.",
    ]
    if match:
        rationale.append(
            f"The saved match score is {match.score}%, with title alignment of {match.title_score}%."
        )

    negotiation_points = [
        "Discuss scope, portfolio complexity, leadership expectations, and transformation mandate before naming a final number.",
        "Evaluate base salary, annual bonus, long-term incentives, retirement contributions, health benefits, and flexibility together.",
        "Use the minimum base as a private decision threshold, not as the opening ask.",
        "Ask how performance is measured and how incentive compensation is calculated.",
    ]

    return {
        "target_base": target_base,
        "minimum_base": minimum_base,
        "target_bonus_pct": bonus_pct,
        "total_comp_target": total_comp_target,
        "rationale": rationale,
        "negotiation_points": negotiation_points,
    }


def explain_match(match: JobMatch | None) -> dict:
    if not match:
        return {
            "overall": 0,
            "recommendation": "Score this job before making a fit decision.",
            "strengths": [],
            "gaps": [],
            "details": {},
        }

    strengths = list(match.matched_keywords or [])
    if match.title_score >= 75:
        strengths.insert(0, "Strong title alignment")
    if match.location_score >= 80:
        strengths.append("Location preference alignment")
    if match.resume_score >= 70:
        strengths.append("Strong resume-language overlap")

    gaps = list(match.missing_keywords or []) + list(match.concerns or [])
    strengths = list(dict.fromkeys(strengths))[:10]
    gaps = list(dict.fromkeys(gaps))[:10]

    if match.score >= 80:
        recommendation = "High priority: tailor and apply."
    elif match.score >= 65:
        recommendation = "Strong possibility: address the gaps before applying."
    elif match.score >= 50:
        recommendation = "Selective application: verify the strategic value first."
    else:
        recommendation = "Low priority unless the opportunity is unusually attractive."

    return {
        "overall": match.score,
        "recommendation": recommendation,
        "strengths": strengths,
        "gaps": gaps,
        "details": {
            "title": match.title_score,
            "keywords": match.keyword_score,
            "location": match.location_score,
            "resume": match.resume_score,
        },
    }


def build_apply_checklist(application: Application, job: Job, match: JobMatch | None):
    explanation = explain_match(match)
    return {
        "application_id": application.id,
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "url": job.url,
        },
        "match_explanation": explanation,
        "checklist": [
            {
                "item": "Review the original posting",
                "complete": bool(job.url),
            },
            {
                "item": "Attach a tailored resume",
                "complete": bool(application.tailoring_id),
            },
            {
                "item": "Generate an application package",
                "complete": False,
            },
            {
                "item": "Confirm compensation expectations",
                "complete": False,
            },
            {
                "item": "Submit the application",
                "complete": application.status not in {"wishlist"},
            },
            {
                "item": "Set the next follow-up action",
                "complete": bool(application.next_action or application.follow_up_at),
            },
        ],
    }
