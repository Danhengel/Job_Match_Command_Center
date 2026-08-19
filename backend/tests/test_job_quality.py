from app.services import job_quality


def test_dedupe_normalizes_company_and_location_variants():
    rows = [
        {
            "title": "Director, Loan Operations",
            "company": "Example Bank, Inc.",
            "location": "Tampa, Florida, United States",
            "description": "Short aggregator description",
            "url": "https://example.com/a",
            "source": "JSearch",
            "posted_at": "2026-08-10T12:00:00Z",
            "salary": "",
            "employment_type": "Full-time",
        },
        {
            "title": "Director Loan Operations",
            "company": "Example Bank",
            "location": "Tampa, FL",
            "description": "Long direct employer description " * 30,
            "url": "https://example.com/careers/123",
            "source": "Workday career page",
            "posted_at": "2026-08-18T12:00:00Z",
            "salary": "$150,000 - $180,000",
            "employment_type": "Full-time",
        },
    ]

    result = job_quality.dedupe_rows(rows)

    assert len(result) == 1
    assert result[0]["source"] == "Workday career page"


def test_remote_locations_dedupe_across_wording():
    rows = [
        {
            "title": "VP Credit Operations",
            "company": "Example Financial",
            "location": "Remote - United States",
            "description": "A",
            "url": "https://example.com/1",
            "source": "LinkedIn",
            "posted_at": "",
        },
        {
            "title": "VP Credit Operations",
            "company": "Example Financial LLC",
            "location": "Work from home - USA",
            "description": "B" * 100,
            "url": "https://example.com/2",
            "source": "Greenhouse",
            "posted_at": "",
        },
    ]

    result = job_quality.dedupe_rows(rows)

    assert len(result) == 1
    assert result[0]["source"] == "Greenhouse"


def test_verified_fresh_direct_source_ranks_above_aggregator_at_same_match():
    direct = job_quality.ranking_score(
        80,
        "Greenhouse career page",
        "2026-08-18T12:00:00Z",
        "open",
    )
    aggregator = job_quality.ranking_score(
        80,
        "JSearch",
        "2026-07-01T12:00:00Z",
        "unverified",
    )

    assert direct > aggregator


def test_closed_job_is_heavily_penalized():
    closed = job_quality.ranking_score(
        95,
        "LinkedIn",
        "2026-08-18T12:00:00Z",
        "closed",
    )
    active = job_quality.ranking_score(
        70,
        "LinkedIn",
        "2026-08-18T12:00:00Z",
        "open",
    )

    assert closed < active
