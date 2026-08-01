from __future__ import annotations


def build_interview_prep(candidate_name: str, job, match, evidence: list[str]) -> dict:
    matched = (match.matched_keywords if match else []) or []
    strengths = ", ".join(matched[:5]) or "lending operations, risk management, and leadership"
    opening = (
        f"I am {candidate_name}, a senior operations and lending leader with experience relevant to "
        f"the {job.title} role at {job.company}. My strongest alignment is in {strengths}. "
        "I build scalable operating models, strengthen controls, improve execution, and partner across "
        "credit, servicing, technology, and business teams."
    )
    questions = [
        {"question": f"Why are you interested in the {job.title} role at {job.company}?", "guidance": "Connect the company, role scope, and your verified experience."},
        {"question": "Describe the most complex lending or servicing operation you have led.", "guidance": "Use scale, team size, controls, cycle time, and outcomes."},
        {"question": "How do you balance growth, customer experience, and credit risk?", "guidance": "Explain governance, escalation, controls, and business partnership."},
        {"question": "Tell me about a process you built or transformed from the ground up.", "guidance": "Use a STAR story with measurable impact."},
        {"question": "How do you lead through competing priorities and high volume?", "guidance": "Discuss prioritization, dashboards, service standards, and delegation."},
        {"question": "How do you prepare an operation for audits or regulatory review?", "guidance": "Address documentation, evidence, testing, issue management, and remediation."},
        {"question": "What would your first 90 days look like?", "guidance": "Listen, diagnose, stabilize, prioritize, and deliver an early win."},
    ]
    star = [
        {"theme": "Build from zero", "prompt": "A time you designed a new operating model, workflow, or control framework."},
        {"theme": "Risk escalation", "prompt": "A time early escalation prevented loss, delay, or compliance failure."},
        {"theme": "Scale and volume", "prompt": "A time you managed rapid growth without sacrificing quality."},
        {"theme": "Technology", "prompt": "A time you improved a portal, system, dashboard, or automation."},
        {"theme": "Leadership", "prompt": "A time you developed a team and improved accountability."},
    ]
    if evidence:
        star[0]["evidence"] = evidence[0]
        for idx, line in enumerate(evidence[1:4], start=1):
            if idx < len(star): star[idx]["evidence"] = line
    questions_to_ask = [
        "What outcomes would define success in the first six and twelve months?",
        "Where are the largest operational, risk, or capacity constraints today?",
        "How are responsibilities divided across credit, servicing, operations, and technology?",
        "What transformation initiatives are already underway?",
        "How would you describe the leadership culture and decision-making style?",
    ]
    negotiation = [
        "Anchor compensation to role scope, team leadership, portfolio scale, and transformation responsibility.",
        "Clarify base salary, annual incentive, long-term incentives, retirement, and severance terms.",
        "Discuss remote/hybrid expectations, travel, and relocation only after confirming mutual fit.",
    ]
    thank_you = "\n".join([
        f"Subject: Thank You - {job.title}",
        "",
        "Dear Hiring Team,",
        "",
        f"Thank you for discussing the {job.title} opportunity at {job.company}. I appreciated learning more about the team's priorities and the outcomes expected from this role. Our conversation reinforced my interest, particularly the opportunity to contribute in {strengths}.",
        "",
        "I would welcome the opportunity to continue the conversation and share additional examples of how I have built scalable operations, strengthened risk controls, and improved execution.",
        "",
        "Sincerely,",
        candidate_name,
    ])
    return {"opening_statement": opening, "questions": questions, "star_prompts": star, "questions_to_ask": questions_to_ask, "negotiation_points": negotiation, "thank_you_email": thank_you}
