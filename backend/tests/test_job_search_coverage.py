from app.api.routes.jobs import (
    expand_search_titles,
    prioritized_search_titles,
    split_search_locations,
)
from app.api.routes.job_search_all import (
    NICHE_JOB_SOURCES,
    PLACEMENT_AGENCIES,
    STRATEGIC_EMPLOYERS,
    niche_source_queries,
    placement_agency_queries,
    strategic_employer_queries,
)


def test_compound_tampa_remote_location_splits_into_two_searches():
    assert split_search_locations("Tampa, Florida or Remote") == [
        "Tampa, Florida",
        "St. Petersburg, Florida",
        "Riverview, Florida",
        "Florida",
        "Remote - United States",
    ]


def test_requested_titles_are_preserved_before_expansions():
    base = [
        "Vice President, Loan Servicing",
        "Director, Asset Management",
    ]
    expanded = [
        "Vice President, Loan Servicing",
        "Loan Administration",
        "Director, Asset Management",
        "Multifamily Asset Management",
    ]

    assert prioritized_search_titles(base, expanded, limit=3) == [
        "Vice President, Loan Servicing",
        "Director, Asset Management",
        "Loan Administration",
    ]


def test_additional_executive_role_families_expand():
    expanded = expand_search_titles(
        [
            "Director, Asset Management",
            "Director, Special Servicing",
            "Director, Capital Programs",
        ]
    )

    assert "Affordable Housing Asset Management" in expanded
    assert "Loan Workout" in expanded
    assert "Construction Program Management" in expanded


def test_major_placement_agencies_are_searched():
    queries = placement_agency_queries(
        ["Vice President, Loan Servicing"],
        "Remote",
    )

    assert len(queries) == len(PLACEMENT_AGENCIES)
    assert any(agency == "Robert Half" for agency, _query in queries)
    assert any(agency == "Michael Page" for agency, _query in queries)
    assert all("Vice President, Loan Servicing" in query for _agency, query in queries)


def test_niche_job_sources_receive_targeted_queries():
    queries = niche_source_queries(
        ["Director, Asset Management"],
        "Remote",
    )

    assert len(queries) == len(NICHE_JOB_SOURCES)
    assert any(name == "CREFC Career Center" for name, _query in queries)
    assert any(name == "OFN Job Bank" for name, _query in queries)


def test_strategic_employer_watchlist_receives_queries():
    queries = strategic_employer_queries(
        ["Director, Commercial Loan Operations"],
        "Tampa, Florida",
    )

    assert len(queries) == len(STRATEGIC_EMPLOYERS)
    assert any(name == "Suncoast Credit Union" for name, _query in queries)
    assert any(name == "CAHEC" for name, _query in queries)


def test_finance_titles_expand_across_executive_role_families():
    expanded = expand_search_titles(["Director, Construction Loan Administration"])

    assert "Senior Director, CRE Loan Operations" in expanded
    assert "Vice President, Credit Administration and Risk" in expanded
    assert "Head of, Special Servicing and Loan Workouts" in expanded


def test_placement_agency_queries_include_financial_specialties():
    query = dict(
        placement_agency_queries(
            ["Vice President, Loan Servicing"],
            "Remote - United States",
        )
    )["Robert Half"]

    assert "commercial real estate" in query
    assert "credit risk" in query
    assert "affordable housing" in query
