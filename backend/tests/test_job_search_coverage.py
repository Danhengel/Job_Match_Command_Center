from app.api.routes.jobs import (
    expand_search_titles,
    prioritized_search_titles,
    split_search_locations,
)


def test_compound_tampa_remote_location_splits_into_two_searches():
    assert split_search_locations("Tampa, Florida or Remote") == [
        "Tampa, Florida",
        "Remote",
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
