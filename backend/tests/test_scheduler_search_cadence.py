from datetime import datetime
from types import SimpleNamespace

from app.services.scheduler import _search_due


def _preference():
    return SimpleNamespace(
        default_search_cadence="twice_daily",
        daily_brief_hour=8,
        weekly_report_day=1,
        timezone="America/New_York",
    )


def test_twice_daily_search_runs_in_morning_and_afternoon_slots():
    search = SimpleNamespace(
        cadence="twice_daily",
        last_run_at=datetime(2026, 8, 22, 12, 30),
    )

    assert _search_due(
        search,
        datetime(2026, 8, 22, 16, 30),
        _preference(),
    )


def test_twice_daily_search_does_not_repeat_same_slot():
    search = SimpleNamespace(
        cadence="twice_daily",
        last_run_at=datetime(2026, 8, 22, 21, 0),
    )

    assert not _search_due(
        search,
        datetime(2026, 8, 22, 18, 0),
        _preference(),
    )
