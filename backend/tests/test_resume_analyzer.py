from app.services.resume_analyzer import analyze_resume

def test_resume_analysis_rewards_metrics_and_keywords():
    text = """
    Directed construction loan administration for a $300 million portfolio.
    Managed 400 projects and improved draw turnaround by 25%.
    Built audit controls, risk reporting, and servicing workflows.
    Led a team of 8 and delivered 100% audit readiness.
    """
    result = analyze_resume(
        text,
        ["construction loan administration","risk","audit","servicing","team leadership"],
        ["Director, Construction Loan Administration"],
    )
    assert result["score"] >= 60
    assert len(result["metrics_found"]) >= 2
    assert result["strengths"]

def test_resume_analysis_identifies_gaps():
    result = analyze_resume("Managed daily operations.", ["credit risk","portfolio management"], [])
    assert "credit risk" in result["gaps"]
