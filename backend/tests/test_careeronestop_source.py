from app.core.config import settings
from app.services import careeronestop_source


def test_careeronestop_jobs_normalize_nlx_results(monkeypatch):
    monkeypatch.setattr(settings, "careeronestop_user_id", "test-user")
    monkeypatch.setattr(settings, "careeronestop_api_token", "test-token")
    monkeypatch.setattr(careeronestop_source, "get_json", None, raising=False)
    monkeypatch.setattr(
        careeronestop_source,
        "cached",
        lambda _key, loader, _ttl: loader(),
    )

    calls = []

    def fake_get_json_url(url, params=None, headers=None):
        calls.append({"url": url, "params": params, "headers": headers})
        return {
            "JobCount": "1",
            "Jobs": [
                {
                    "JvId": "abc-123",
                    "JobTitle": "Director, Loan Operations",
                    "Company": "Example Bank",
                    "DescriptionSnippet": (
                        "Lead a remote commercial loan servicing team."
                    ),
                    "AcquisitionDate": "2026-08-05",
                    "URL": "https://example.com/jobs/abc-123",
                    "Location": "Remote, United States",
                    "OnetCodes": ["11-1021.00"],
                }
            ],
        }

    monkeypatch.setattr(
        careeronestop_source,
        "get_json_url",
        fake_get_json_url,
    )

    rows = careeronestop_source.jobs("loan operations", "Remote")

    assert len(rows) == 1
    assert rows[0]["source"] == "CareerOneStop / NLx"
    assert rows[0]["title"] == "Director, Loan Operations"
    assert rows[0]["company"] == "Example Bank"
    assert rows[0]["remote"] is True
    assert rows[0]["posted_at"] == "2026-08-05"
    assert rows[0]["provider_key"]

    assert len(calls) == 1
    assert "/test-user/loan%20operations/0/50/" in calls[0]["url"]
    assert calls[0]["headers"]["Authorization"] == "Bearer test-token"
    assert calls[0]["params"]["enableJobDescriptionSnippet"] == "true"


def test_careeronestop_requires_credentials(monkeypatch):
    monkeypatch.setattr(settings, "careeronestop_user_id", "")
    monkeypatch.setattr(settings, "careeronestop_api_token", "")

    try:
        careeronestop_source.jobs("loan servicing", "Tampa, FL")
    except RuntimeError as exc:
        assert "CAREERONESTOP_USER_ID" in str(exc)
    else:
        raise AssertionError("Expected missing credentials to fail")
