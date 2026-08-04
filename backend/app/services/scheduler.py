from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.automation import AutomationPreference, Notification, SavedSearch
from app.models.user import User
from app.services.automation_service import (
    notification_exists,
    refresh_smart_notifications,
    run_saved_search,
)
from app.services.report_service import build_weekly_report


scheduler = BackgroundScheduler(timezone="UTC")
_scheduler_state = {
    "last_started_at": None,
    "last_finished_at": None,
    "last_result": None,
    "last_error": None,
}


def _utc_naive(now: datetime | None = None) -> datetime:
    value = now or datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _local_now(preference: AutomationPreference, now_utc: datetime) -> datetime:
    try:
        zone = ZoneInfo(preference.timezone or "UTC")
    except ZoneInfoNotFoundError:
        zone = ZoneInfo("UTC")
    aware_utc = now_utc.replace(tzinfo=timezone.utc)
    return aware_utc.astimezone(zone)


def _in_quiet_hours(hour: int, start: int, end: int) -> bool:
    if start == end:
        return False
    if start < end:
        return start <= hour < end
    return hour >= start or hour < end


def _search_due(search: SavedSearch, local_now: datetime, preference: AutomationPreference) -> bool:
    cadence = (search.cadence or preference.default_search_cadence or "daily").lower()
    if cadence in {"manual", "manual-only"}:
        return False
    if local_now.hour < preference.daily_brief_hour:
        return False
    if cadence == "weekdays" and local_now.weekday() >= 5:
        return False
    if cadence == "weekly" and local_now.weekday() != preference.weekly_report_day:
        return False
    if not search.last_run_at:
        return True
    try:
        zone = ZoneInfo(preference.timezone or "UTC")
    except ZoneInfoNotFoundError:
        zone = ZoneInfo("UTC")
    last_local = search.last_run_at.replace(tzinfo=timezone.utc).astimezone(zone)
    if cadence in {"daily", "weekdays"}:
        return last_local.date() < local_now.date()
    if cadence == "weekly":
        return last_local.isocalendar()[:2] < local_now.isocalendar()[:2]
    return False


def _ensure_preference(db: Session, user_id: int) -> AutomationPreference:
    item = db.query(AutomationPreference).filter(AutomationPreference.user_id == user_id).first()
    if not item:
        item = AutomationPreference(user_id=user_id)
        db.add(item)
        db.commit()
        db.refresh(item)
    return item


def _create_daily_brief_notification(db: Session, preference: AutomationPreference, local_now: datetime) -> int:
    if not preference.daily_brief_enabled or local_now.hour < preference.daily_brief_hour:
        return 0
    key = local_now.date().isoformat()
    if notification_exists(db, preference.user_id, "daily_brief", "local_date", key):
        return 0
    unread = db.query(Notification).filter(
        Notification.user_id == preference.user_id,
        Notification.read.is_(False),
    ).all()
    counts: dict[str, int] = {}
    for item in unread:
        counts[item.kind] = counts.get(item.kind, 0) + 1
    message = (
        f"{counts.get('follow_up', 0)} follow-ups, "
        f"{counts.get('interview_reminder', 0)} interview reminders, and "
        f"{counts.get('high_match', 0) + counts.get('saved_search', 0)} job updates need review."
    )
    db.add(Notification(
        user_id=preference.user_id,
        kind="daily_brief",
        title="Your CareerOS daily brief is ready",
        message=message,
        link="/command-center",
        metadata_json={"local_date": key},
    ))
    db.commit()
    return 1


def _create_weekly_report_notification(db: Session, preference: AutomationPreference, local_now: datetime) -> int:
    if not preference.weekly_report_enabled:
        return 0
    if local_now.weekday() != preference.weekly_report_day or local_now.hour < preference.weekly_report_hour:
        return 0
    week_key = f"{local_now.isocalendar().year}-W{local_now.isocalendar().week:02d}"
    if notification_exists(db, preference.user_id, "weekly_report", "week", week_key):
        return 0
    report = build_weekly_report(db, preference.user_id)
    summary = report.get("summary", report)
    applications = summary.get("applications_submitted", summary.get("applications", 0))
    interviews = summary.get("interviews_completed", summary.get("interviews", 0))
    matches = summary.get("matches_generated", summary.get("matches", 0))
    db.add(Notification(
        user_id=preference.user_id,
        kind="weekly_report",
        title="Your weekly executive report is ready",
        message=f"This week: {applications} applications, {interviews} interviews, and {matches} job matches recorded.",
        link="/reports/weekly",
        metadata_json={"week": week_key},
    ))
    db.commit()
    return 1


def run_user_automation(db: Session, user_id: int, now_utc: datetime | None = None) -> dict:
    now = _utc_naive(now_utc)
    preference = _ensure_preference(db, user_id)
    local_now = _local_now(preference, now)
    quiet = _in_quiet_hours(local_now.hour, preference.quiet_hours_start, preference.quiet_hours_end)
    categories = preference.notification_categories or {}
    result = {
        "user_id": user_id,
        "timezone": preference.timezone,
        "local_time": local_now.isoformat(),
        "quiet_hours": quiet,
        "searches_run": 0,
        "search_errors": 0,
        "follow_ups_created": 0,
        "interview_reminders_created": 0,
        "daily_briefs_created": 0,
        "weekly_reports_created": 0,
    }

    if not quiet:
        searches = db.query(SavedSearch).filter(
            SavedSearch.user_id == user_id,
            SavedSearch.active.is_(True),
        ).all()
        for search in searches:
            if not _search_due(search, local_now, preference):
                continue
            try:
                run_saved_search(db, search, notify=bool(categories.get("jobs", True)))
                result["searches_run"] += 1
            except Exception:
                db.rollback()
                result["search_errors"] += 1

        created = refresh_smart_notifications(
            db,
            user_id,
            follow_up_days=preference.application_follow_up_days,
            interview_reminder_hours=preference.interview_reminder_hours or [48, 24],
            categories=categories,
        )
        result.update(created)
        result["daily_briefs_created"] = _create_daily_brief_notification(db, preference, local_now)
        result["weekly_reports_created"] = _create_weekly_report_notification(db, preference, local_now)

    return result


def run_automation_cycle(now_utc: datetime | None = None) -> dict:
    started = _utc_naive(now_utc)
    _scheduler_state["last_started_at"] = started.isoformat()
    _scheduler_state["last_error"] = None
    db = SessionLocal()
    results: list[dict] = []
    try:
        users = db.query(User).filter(User.is_active.is_(True)).all()
        for user in users:
            try:
                results.append(run_user_automation(db, user.id, started))
            except Exception as exc:
                db.rollback()
                results.append({"user_id": user.id, "error": str(exc)})
        summary = {
            "users_processed": len(results),
            "searches_run": sum(item.get("searches_run", 0) for item in results),
            "notifications_created": sum(
                item.get("follow_ups_created", 0)
                + item.get("interview_reminders_created", 0)
                + item.get("daily_briefs_created", 0)
                + item.get("weekly_reports_created", 0)
                for item in results
            ),
            "results": results,
        }
        _scheduler_state["last_result"] = summary
        return summary
    except Exception as exc:
        _scheduler_state["last_error"] = str(exc)
        raise
    finally:
        finished = datetime.utcnow()
        _scheduler_state["last_finished_at"] = finished.isoformat()
        db.close()


def scheduler_status() -> dict:
    next_run = None
    job = scheduler.get_job("career_automation_cycle") if scheduler.running else None
    if job and job.next_run_time:
        next_run = job.next_run_time.isoformat()
    return {
        "running": scheduler.running,
        "next_run_at": next_run,
        **_scheduler_state,
    }


def start_scheduler():
    if scheduler.running:
        return
    scheduler.add_job(
        run_automation_cycle,
        "interval",
        minutes=15,
        id="career_automation_cycle",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    scheduler.start()
