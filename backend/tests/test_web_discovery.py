import json

from app.services import web_discovery


def test_detect_ats_recognizes_supported_and_discovery_platforms():
    assert web_discovery.detect_ats(
        "https://job-boards.greenhouse.io/acme/jobs/123"
    ) == "greenhouse"
    assert web_discovery.detect_ats(
        "https://acme.wd5.myworkdayjobs.com/en-US/careers/job/123"
    ) == "workday"
    assert web_discovery.detect_ats(
        "https://careers-acme.icims.com/jobs/1001/director/job"
    ) == "icims"
    assert web_discovery.detect_ats("https://example.com/careers/123") == "generic"


def test_parse_jobposting_html_normalizes_remote_salary_and_company():
    payload = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": "Director, Loan Operations",
        "description": "<p>Lead commercial loan operations.</p>",
        "datePosted": "2026-08-01",
        "employmentType": ["FULL_TIME"],
        "jobLocationType": "TELECOMMUTE",
        "applicantLocationRequirements": {
            "@type": "Country",
            "name": "United States",
        },
        "hiringOrganization": {
            "@type": "Organization",
            "name": "Example Bank",
        },
        "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": 150000,
                "maxValue": 190000,
                "unitText": "YEAR",
            },
        },
        "url": "https://careers.example.com/jobs/123?utm_source=test",
    }
    html = (
        "<html><head><script type='application/ld+json'>"
        + json.dumps(payload)
        + "</script></head></html>"
    )

    rows = web_discovery.parse_jobposting_html(
        html,
        "https://careers.example.com/jobs/123",
    )

    assert len(rows) == 1
    row = rows[0]
    assert row["title"] == "Director, Loan Operations"
    assert row["company"] == "Example Bank"
    assert row["location"] == "Remote — United States"
    assert row["remote"] is True
    assert row["salary"] == "USD 150000 - 190000 YEAR"
    assert row["url"] == "https://careers.example.com/jobs/123"


def test_brave_jobs_uses_structured_job_pages(monkeypatch):
    monkeypatch.setattr(web_discovery.settings, "brave_search_api_key", "test-key")
    monkeypatch.setattr(web_discovery, "get_json", lambda _key: None)
    monkeypatch.setattr(web_discovery, "set_json", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(
        web_discovery,
        "get_json_url",
        lambda *_args, **_kwargs: {
            "web": {
                "results": [
                    {"url": "https://careers.example.com/jobs/123"},
                    {"url": "https://www.linkedin.com/jobs/view/456"},
                ]
            }
        },
    )
    monkeypatch.setattr(
        web_discovery,
        "fetch_jobposting_rows",
        lambda url: [
            {
                "provider_key": "abc",
                "title": "Director, Loan Operations",
                "company": "Example Bank",
                "location": "Remote",
                "description": "Lead loan operations.",
                "url": url,
                "source": "Employer career page",
                "posted_at": "2026-08-01",
                "salary": "",
                "employment_type": "FULL_TIME",
                "remote": True,
            }
        ],
    )

    rows = web_discovery.brave_jobs(
        "Director, Loan Operations",
        "United States",
    )

    assert len(rows) == 1
    assert rows[0]["source"] == "Employer career page"
