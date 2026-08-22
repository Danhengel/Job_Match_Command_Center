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


def test_recruiter_source_ranks_below_direct_employer_but_above_aggregator():
    recruiter = job_quality.source_quality(
        "Placement agency: Robert Half / JSearch"
    )

    assert recruiter < job_quality.source_quality("Greenhouse career page")
    assert recruiter > job_quality.source_quality("JSearch")


def test_quality_gate_rejects_missing_links_and_stale_jobs():
    assert not job_quality.row_passes_quality_gate(
        {"url": "", "posted_at": "2026-08-20"}
    )
    assert not job_quality.row_passes_quality_gate(
        {"url": "https://example.com/job", "posted_at": "2025-01-01"}
    )
    assert job_quality.row_passes_quality_gate(
        {"url": "https://example.com/job", "posted_at": ""}
    )


def test_two_stage_ranking_removes_closed_results():
    items = [
        {
            "job": {
                "url": "https://example.com/open",
                "source": "Greenhouse",
                "posted_at": "",
            },
            "match": {"score": 75},
        },
        {
            "job": {
                "url": "https://example.com/closed",
                "source": "Indeed",
                "posted_at": "",
                "verification_status": "closed",
            },
            "match": {"score": 95},
        },
    ]

    ranked = job_quality.rank_serialized_results(items)

    assert len(ranked) == 1
    assert ranked[0]["job"]["url"].endswith("/open")
