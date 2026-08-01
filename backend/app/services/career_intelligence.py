from __future__ import annotations
import re
from collections import Counter


def _recommendation(score: int, concerns: list[str]) -> str:
    if score >= 80 and len(concerns) <= 1:
        return "Apply now"
    if score >= 65:
        return "Strong candidate - tailor before applying"
    if score >= 50:
        return "Selective apply - address the gaps first"
    return "Low priority unless the role is strategically important"


def build_application_package(
    candidate_name,
    profile,
    job,
    match,
    tailoring,
):
    score = match.score if match else 0
    matched = list(match.matched_keywords or []) if match else []
    missing = list(match.missing_keywords or []) if match else []
    concerns = list(match.concerns or []) if match else []

    evidence = (
        list(tailoring.selected_evidence or [])
        if tailoring
        else []
    )

    strengths = matched[:8]
    if match and match.title_score >= 75:
        strengths.insert(0, "Strong title alignment")
    if match and match.location_score >= 80:
        strengths.append("Location preference alignment")
    if evidence:
        strengths.append("Verified resume evidence is available")
    strengths = list(dict.fromkeys(strengths))[:10]

    gaps = missing[:8] + concerns[:4]
    gaps = list(dict.fromkeys(gaps))[:10]

    recommendation = _recommendation(score, concerns)
    summary = (
        f"This opportunity is a {score}% profile match. "
        f"Title alignment is {match.title_score if match else 0}%, "
        f"keyword coverage is {match.keyword_score if match else 0}%, "
        f"location fit is {match.location_score if match else 0}%, and "
        f"resume-language overlap is {match.resume_score if match else 0}%. "
        f"Recommendation: {recommendation}."
    )

    strength_text = ", ".join(strengths[:6]) or "lending operations leadership"
    executive_summary = (
        f"{candidate_name} is positioned for the {job.title} opportunity at "
        f"{job.company} through demonstrated experience in {strength_text}. "
        "The application should lead with verified scope, portfolio, team, "
        "risk-control, and process-improvement results that directly support "
        "the employer's stated priorities."
    )

    recruiter_email = (
        f"Subject: {job.title} - {candidate_name}\n\n"
        f"Hello,\n\nI am reaching out regarding the {job.title} role at "
        f"{job.company}. My background aligns with the position's emphasis on "
        f"{strength_text}. I have prepared a role-specific resume that highlights "
        "the most relevant verified experience and measurable outcomes.\n\n"
        "I would welcome a brief conversation to discuss the team's priorities "
        "and how my experience could contribute.\n\n"
        f"Best,\n{candidate_name}"
    )

    linkedin_message = (
        f"Hello - I am interested in the {job.title} opportunity at "
        f"{job.company}. My experience aligns with {strength_text}. "
        "I would appreciate connecting and learning more about the role and team."
    )

    plan = [
        {
            "period": "First 30 days",
            "focus": (
                "Learn the portfolio, stakeholders, systems, controls, service "
                "standards, current risks, and performance measures."
            ),
        },
        {
            "period": "Days 31-60",
            "focus": (
                "Validate process gaps, prioritize quick wins, establish reporting "
                "cadence, and align operating procedures with business and risk partners."
            ),
        },
        {
            "period": "Days 61-90",
            "focus": (
                "Implement the highest-value improvements, formalize governance, "
                "measure outcomes, and present a scalable operating roadmap."
            ),
        },
    ]

    salary_strategy = [
        "Anchor the discussion to role scope, portfolio complexity, leadership expectations, and market level.",
        "Use the profile salary target as a planning point, not an unsupported market claim.",
        "Evaluate base salary, annual incentive, long-term incentives, retirement, health benefits, and flexibility together.",
        "Delay a final number until the responsibilities and total compensation structure are clear.",
    ]

    return {
        "fit_score": score,
        "fit_recommendation": recommendation,
        "fit_summary": summary,
        "strengths": strengths,
        "gaps": gaps,
        "executive_summary": executive_summary,
        "recruiter_email": recruiter_email,
        "linkedin_message": linkedin_message,
        "plan_30_60_90": plan,
        "salary_strategy": salary_strategy,
    }


def build_company_summary(company, jobs, applications, watches):
    job_count = len(jobs)
    remote_count = sum(1 for job in jobs if job.remote)
    salary_count = sum(1 for job in jobs if job.salary)
    titles = Counter(job.title for job in jobs).most_common(5)
    application_count = len(applications)
    stages = Counter(app.status for app in applications)

    return {
        "company": company,
        "open_job_count": job_count,
        "remote_job_count": remote_count,
        "salary_listed_count": salary_count,
        "application_count": application_count,
        "application_stages": dict(stages),
        "top_titles": [
            {"title": title, "count": count}
            for title, count in titles
        ],
        "watched": any(w.active for w in watches),
        "watch_notes": next(
            (w.notes for w in watches if w.active),
            "",
        ),
    }


def answer_career_question(
    question,
    profile=None,
    application=None,
    job=None,
    match=None,
    tailoring=None,
):
    q = question.lower()
    context = []

    if job:
        context.append(f"Role: {job.title} at {job.company}.")
    if match:
        context.append(
            f"Match: {match.score}% with title {match.title_score}%, "
            f"keywords {match.keyword_score}%, location {match.location_score}%, "
            f"and resume overlap {match.resume_score}%."
        )
    if profile:
        context.append(
            f"Profile: {profile.name}; target titles include "
            f"{', '.join((profile.target_titles or [])[:5])}."
        )

    if "should i apply" in q or "apply" in q:
        if not match:
            answer = (
                "I need a selected application or scored job to make a grounded "
                "apply recommendation."
            )
        else:
            answer = (
                f"The current match is {match.score}%. "
                f"{_recommendation(match.score, match.concerns or [])}. "
                f"Lead with: {', '.join((match.matched_keywords or [])[:6]) or 'verified leadership evidence'}. "
                f"Review before applying: {', '.join((match.missing_keywords or [])[:5]) or 'no major keyword gaps detected'}."
            )
    elif "salary" in q or "compensation" in q:
        target = getattr(profile, "salary_target", None) if profile else None
        answer = (
            "Build the negotiation around scope, leadership accountability, "
            "portfolio complexity, incentive structure, and total compensation. "
            + (
                f"Your saved profile target is ${target:,.0f}; use it as an internal "
                "planning point after confirming the role's full scope."
                if target
                else "Add a salary target to the career profile for a more specific planning response."
            )
        )
    elif "interview" in q:
        evidence = list(tailoring.selected_evidence or [])[:3] if tailoring else []
        answer = (
            "Prepare three stories: building or improving an operating model, "
            "resolving a material risk or delivery issue, and leading stakeholders "
            "through change. "
            + (
                "Relevant saved evidence includes: " + " | ".join(evidence)
                if evidence
                else "Attach a tailored resume to the application so the coach can use saved evidence."
            )
        )
    elif "resume" in q or "bullet" in q:
        answer = (
            "Prioritize verified accomplishment statements that show action, scope, "
            "complexity, and measurable outcome. Do not add missing keywords unless "
            "you can support them with real experience. Use the Tailoring Studio to "
            "select evidence for the specific job."
        )
    elif "priority" in q or "next" in q:
        answer = (
            "Prioritize high-match jobs with strong title alignment, acceptable "
            "location, and clear evidence in the resume. Next, tailor the resume, "
            "save the job to the CRM, generate the application package, and set a "
            "specific follow-up date."
        )
    else:
        answer = (
            "Use the available profile, job-match, tailoring, and application data "
            "to make the decision. Focus on verified strengths, material gaps, role "
            "scope, location, compensation structure, and the next concrete action."
        )

    if context:
        return " ".join(context) + "\n\n" + answer
    return answer
