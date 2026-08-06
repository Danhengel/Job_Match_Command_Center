from types import SimpleNamespace

from app.services import saved_search_runner


def _row(source: str, title: str = "Director Loan Operations") -> dict:
    return {
        "provider_key": f"{source}-{title}",
        "title": title,
        "company": f"{source} Company",
        "location": "Remote",
        "description": "loan operations construction lending portfolio leadership",
        "url": f"https://example.com/{source}",
        "source": source,
        "posted_at": "2026-08-06",
        "salary": "",
        "employment_type": "Full-time",
        "remote": True,
    }


def _search(**overrides):
    values = {
        "titles": ["Director Loan Operations"],
        "location": "Tampa, Florida or Remote",
        "use_remotive": False,
        "use_catalog": False,
        "use_jsearch": False,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_collect_saved_search_rows_uses_expanded_sources(monkeypatch):
    for name in ("remotive", "remoteok", "jobicy", "himalayas", "jsearch"):
        monkeypatch.setattr(
            saved_search_runner.job_sources,
            name,
            lambda *args, _name=name: [_row(_name)],
        )
    monkeypatch.setattr(
        saved_search_runner.external_job_sources,
        "connector_capabilities",
        lambda: {"usajobs": True, "adzuna": False, "jooble": False},
    )
    monkeypatch.setattr(
        saved_search_runner.external_job_sources,
        "usajobs",
        lambda *args: [_row("USAJOBS")],
    )
    monkeypatch.setattr(
        saved_search_runner.careeronestop_source,
        "configured",
        lambda: True,
    )
    monkeypatch.setattr(
        saved_search_runner.careeronestop_source,
        "jobs",
        lambda *args: [_row("CareerOneStop / NLx")],
    )
    monkeypatch.setattr(
        saved_search_runner.web_discovery,
        "connector_capabilities",
        lambda: {"brave": True},
    )
    monkeypatch.setattr(
        saved_search_runner.web_discovery,
        "brave_jobs",
        lambda *args: [_row("Brave")],
    )

    result = saved_search_runner.collect_saved_search_rows(
        _search(use_remotive=True, use_jsearch=True)
    )

    assert result["raw_count"] == 8
    assert {
        "Remotive",
        "Remote OK",
        "Jobicy",
        "Himalayas",
        "JSearch / Google Jobs publishers",
        "USAJOBS",
        "CareerOneStop / NLx",
        "Brave web discovery",
    }.issubset(result["searched_sources"])
    assert any("Adzuna is not configured" in note for note in result["coverage_notes"])
    assert result["errors"] == []


def test_collect_saved_search_rows_reports_unconfigured_optional_sources(monkeypatch):
    monkeypatch.setattr(
        saved_search_runner.external_job_sources,
        "connector_capabilities",
        lambda: {"usajobs": False, "adzuna": False, "jooble": False},
    )
    monkeypatch.setattr(
        saved_search_runner.careeronestop_source,
        "configured",
        lambda: False,
    )
    monkeypatch.setattr(
        saved_search_runner.web_discovery,
        "connector_capabilities",
        lambda: {"brave": False},
    )

    result = saved_search_runner.collect_saved_search_rows(_search())

    assert result["rows"] == []
    assert result["searched_sources"] == []
    assert len(result["coverage_notes"]) == 5


def test_saved_generic_career_page_is_filtered_and_audited(monkeypatch):
    monkeypatch.setattr(
        saved_search_runner.external_job_sources,
        "connector_capabilities",
        lambda: {"usajobs": False, "adzuna": False, "jooble": False},
    )
    monkeypatch.setattr(
        saved_search_runner.careeronestop_source,
        "configured",
        lambda: False,
    )
    monkeypatch.setattr(
        saved_search_runner.web_discovery,
        "connector_capabilities",
        lambda: {"brave": False},
    )
    monkeypatch.setattr(
        saved_search_runner.web_discovery,
        "fetch_jobposting_rows",
        lambda url: [
            _row("Employer", "Director Loan Operations"),
            _row("Employer", "Software Engineer"),
        ],
    )
    watch = SimpleNamespace(
        active=True,
        ats_type="unknown",
        board_identifier="",
        career_url="https://employer.example/careers",
        last_checked_at=None,
        last_job_count=0,
        last_error="",
    )

    result = saved_search_runner.collect_saved_search_rows(_search(), [watch])

    assert len(result["rows"]) == 1
    assert result["rows"][0]["title"] == "Director Loan Operations"
    assert watch.last_checked_at is not None
    assert watch.last_job_count == 1
    assert watch.last_error == ""
