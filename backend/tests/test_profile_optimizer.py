from app.services.profile_optimizer import optimize_profile_from_resume


def test_sales_resume_maps_to_saas_sales_without_overclaiming_management():
    text = """
    Dynamic SaaS sales leader and Account Executive with 17+ years of experience in B2B sales,
    software sales, and full-cycle sales. Proven quota attainment, territory management, pipeline
    management, lead generation, prospecting, solution selling, upselling, contract negotiation,
    account management, business development, customer retention and strategic account planning.
    Regional Account Executive | EarthCam | Remote
    Grew territory from zero to $1.5 million and delivered 19% year-over-year revenue growth.
    Account Executive, Professional Services | Kaseya
    Achieved 105% of quota. Used Salesforce, ZoomInfo and LinkedIn Sales Navigator. Built
    relationships with C-level executives and partnered with customer success teams.
    """

    result = optimize_profile_from_resume(text)

    assert result["role_family_key"] == "saas_sales"
    assert result["confidence"] == "high"
    assert "Senior Account Executive" in result["recommended_target_titles"]
    assert "Enterprise Account Executive" in result["recommended_target_titles"]
    assert "SaaS sales" in result["recommended_priority_keywords"]
    assert "quota attainment" in result["recommended_priority_keywords"]
    assert result["recommended_remote_preferred"] is True
    assert result["search_ready"] is True


def test_lending_resume_maps_to_lending_family():
    text = """
    Director with 15 years of commercial lending and construction lending experience. Led loan
    operations, construction draw administration, disbursement controls, underwriting support,
    portfolio management, credit risk, audit readiness, covenant management, and vendor management.
    Oversaw commercial real estate and CRE servicing workflows and SBA lending processes.
    """

    result = optimize_profile_from_resume(text, remote_preferred=False, hybrid_preferred=True)

    assert result["role_family_key"] == "lending_credit"
    assert "Director, Construction Loan Administration" in result["recommended_target_titles"]
    assert "construction lending" in result["recommended_priority_keywords"]
    assert result["recommended_remote_preferred"] is False


def test_low_confidence_resume_preserves_existing_profile():
    text = """
    Experienced professional with a long record of collaborative work, communication, research,
    documentation, customer relationships, and team participation across several organizations.
    The candidate is seeking a new professional opportunity with room to contribute and grow.
    """

    result = optimize_profile_from_resume(
        text,
        current_titles=["Existing Target"],
        current_keywords=["Existing Keyword"],
        current_exclusions=["Existing Exclusion"],
    )

    assert result["confidence"] == "low"
    assert result["recommended_target_titles"] == ["Existing Target"]
    assert result["recommended_priority_keywords"] == ["Existing Keyword"]
    assert result["recommended_exclusion_keywords"] == ["Existing Exclusion"]
