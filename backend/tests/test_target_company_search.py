from app.api.routes.job_search_all import (
    normalized_company_name,
    prioritize_target_company_results,
    target_company_queries,
)


def test_target_company_queries_use_primary_title_and_location():
    queries = target_company_queries(
        ["Procore", "Samsara"],
        ["Senior Account Executive", "Account Director"],
        "Brickell, Miami, FL",
    )

    assert queries == [
        (
            "Procore",
            "Senior Account Executive at Procore in Brickell, Miami, FL",
        ),
        (
            "Samsara",
            "Senior Account Executive at Samsara in Brickell, Miami, FL",
        ),
    ]


def test_target_company_results_sort_before_general_results():
    base = {
        "results": [
            {
                "job": {"company": "Other SaaS"},
                "match": {"score": 98},
            },
            {
                "job": {"company": "Procore Technologies"},
                "match": {"score": 88},
            },
            {
                "job": {"company": "Procore"},
                "match": {"score": 82},
            },
        ]
    }

    prioritize_target_company_results(base, ["Procore"])

    assert [item["job"]["company"] for item in base["results"]] == [
        "Procore",
        "Other SaaS",
        "Procore Technologies",
    ]
    assert base["results"][0]["target_company"] is True
    assert base["results"][1]["target_company"] is False


def test_company_normalization_ignores_spacing_and_punctuation():
    assert normalized_company_name("Open-Space, Inc.") == "openspaceinc"
