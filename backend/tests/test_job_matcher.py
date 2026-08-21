from types import SimpleNamespace

from app.services.job_matcher import match_job


def test_strong_title_keyword_and_remote_match():
    profile = SimpleNamespace(
        target_titles=[
            "Director, Construction Loan Administration"
        ],
        priority_keywords=[
            "construction lending",
            "loan servicing",
            "risk management",
        ],
        exclusion_keywords=["entry level"],
        home_location="Riverview, Florida",
        remote_preferred=True,
        hybrid_preferred=True,
    )
    job = SimpleNamespace(
        title="Director, Construction Loan Administration",
        description=(
            "Lead construction lending, loan servicing, and "
            "risk management operations."
        ),
        location="Remote - United States",
        remote=True,
        salary="$170,000-$210,000",
    )

    result = match_job(
        job,
        profile,
        (
            "construction lending loan servicing operations "
            "leadership"
        ),
    )

    assert result["score"] >= 70
    assert result["title_score"] >= 90
    assert len(result["matched_keywords"]) == 3


def test_missing_optional_signals_are_not_scored_as_zero():
    profile = SimpleNamespace(
        target_titles=[
            "Director, Construction Loan Administration"
        ],
        priority_keywords=[],
        exclusion_keywords=[],
        home_location="",
        remote_preferred=True,
        hybrid_preferred=False,
    )
    job = SimpleNamespace(
        title="Director, Construction Loan Administration",
        description="",
        location="Remote - United States",
        remote=True,
        salary="",
    )

    result = match_job(job, profile, "")

    assert result["score"] == 100
    assert "Compensation not listed" in result["concerns"]


def test_missing_salary_is_informational_not_a_score_penalty():
    profile = SimpleNamespace(
        target_titles=[
            "Director, Construction Loan Administration"
        ],
        priority_keywords=[],
        exclusion_keywords=[],
        home_location="",
        remote_preferred=True,
        hybrid_preferred=False,
    )
    base_job = {
        "title": "Director, Construction Loan Administration",
        "description": "",
        "location": "Remote - United States",
        "remote": True,
    }

    listed = match_job(
        SimpleNamespace(**base_job, salary="$180,000"),
        profile,
        "",
    )
    unlisted = match_job(
        SimpleNamespace(**base_job, salary=""),
        profile,
        "",
    )

    assert listed["score"] == unlisted["score"]


def test_exclusion_keywords_still_reduce_score():
    profile = SimpleNamespace(
        target_titles=[
            "Director, Construction Loan Administration"
        ],
        priority_keywords=[],
        exclusion_keywords=["commission only"],
        home_location="",
        remote_preferred=True,
        hybrid_preferred=False,
    )
    job = SimpleNamespace(
        title="Director, Construction Loan Administration",
        description="This position is commission only.",
        location="Remote - United States",
        remote=True,
        salary="$180,000",
    )

    result = match_job(job, profile, "")

    assert result["score"] == 96
    assert "commission only" in result["concerns"]


def test_riverview_profile_treats_tampa_as_local_market():
    profile = SimpleNamespace(
        target_titles=["Director, Commercial Loan Operations"],
        priority_keywords=[],
        exclusion_keywords=[],
        home_location="Riverview, Florida",
        remote_preferred=True,
        hybrid_preferred=True,
    )
    job = SimpleNamespace(
        title="Director, Commercial Loan Operations",
        description="Lead commercial loan servicing operations.",
        location="Tampa, FL",
        remote=False,
        salary="$180,000",
    )

    result = match_job(job, profile, "")

    assert result["location_score"] == 100


def test_executive_search_penalizes_junior_results():
    profile = SimpleNamespace(
        target_titles=["Vice President, Loan Servicing"],
        priority_keywords=["loan servicing"],
        exclusion_keywords=[],
        home_location="Riverview, Florida",
        remote_preferred=True,
        hybrid_preferred=True,
    )
    job = SimpleNamespace(
        title="Loan Servicing Coordinator",
        description="Support loan servicing workflows.",
        location="Remote - United States",
        remote=True,
        salary="$65,000",
    )

    result = match_job(job, profile, "")

    assert result["score"] < 60
    assert "Seniority is below the target level" in result["concerns"]
