from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.automation import AutomationRun, Notification, SavedSearch
from app.models.job import JobMatch, SearchRun
from app.models.profile import CareerProfile
from app.models.recruiting import InterviewEvent, RecruiterContact


def build_weekly_report(db: Session, user_id: int) -> dict:
    now = datetime.utcnow()
    start = now - timedelta(days=7)
    profiles = db.query(CareerProfile).filter(CareerProfile.user_id == user_id).all()
    profile_ids = [item.id for item in profiles]
    applications = db.query(Application).filter(Application.user_id == user_id).all()
    new_applications = [item for item in applications if item.created_at >= start]
    applied = [item for item in applications if item.applied_at and item.applied_at >= start]
    interviews = db.query(InterviewEvent).filter(
        InterviewEvent.user_id == user_id,
        InterviewEvent.starts_at >= start,
        InterviewEvent.starts_at <= now,
    ).all()
    upcoming = db.query(InterviewEvent).filter(
        InterviewEvent.user_id == user_id,
        InterviewEvent.completed.is_(False),
        InterviewEvent.starts_at > now,
        InterviewEvent.starts_at <= now + timedelta(days=7),
    ).count()
    recruiters = db.query(RecruiterContact).filter(
        RecruiterContact.user_id == user_id,
        RecruiterContact.updated_at >= start,
    ).all()
    search_runs = db.query(SearchRun).filter(
        SearchRun.user_id == user_id,
        SearchRun.created_at >= start,
    ).all()
    saved_ids = [item.id for item in db.query(SavedSearch).filter(SavedSearch.user_id == user_id).all()]
    automation_runs = []
    if saved_ids:
        automation_runs = db.query(AutomationRun).filter(
            AutomationRun.saved_search_id.in_(saved_ids),
            AutomationRun.started_at >= start,
        ).all()
    matches = []
    if profile_ids:
        matches = db.query(JobMatch).filter(
            JobMatch.profile_id.in_(profile_ids),
            JobMatch.created_at >= start,
        ).all()
    overdue = [item for item in applications if item.next_action_at and item.next_action_at <= now]
    offers = [item for item in applications if item.status in {"offer", "accepted"}]
    unread = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read.is_(False),
    ).count()
    interview_stage = sum(1 for item in applications if item.status in {"interview", "final", "offer", "accepted"})
    response_stage = sum(1 for item in applications if item.status not in {"wishlist", "applied", "rejected"})
    applied_total = sum(1 for item in applications if item.status != "wishlist")
    recommendations = []
    if overdue:
        recommendations.append(f"Complete {len(overdue)} overdue follow-up{'s' if len(overdue) != 1 else ''} first.")
    if upcoming:
        recommendations.append(f"Prepare for {upcoming} interview event{'s' if upcoming != 1 else ''} scheduled in the next seven days.")
    if len(applied) < 5:
        recommendations.append("Increase application activity toward a five-per-week baseline.")
    if not matches:
        recommendations.append("Run a saved search to refresh high-match opportunities.")
    if not recommendations:
        recommendations.append("Maintain the current pace and focus on the strongest active opportunities.")
    return {
        "period_start": start.isoformat(),
        "period_end": now.isoformat(),
        "applications_created": len(new_applications),
        "applications_submitted": len(applied),
        "interviews_completed": sum(1 for item in interviews if item.completed),
        "interviews_upcoming": upcoming,
        "recruiter_contacts_updated": len(recruiters),
        "jobs_discovered": sum(item.unique_count for item in search_runs) + sum(item.new_job_count for item in automation_runs),
        "matches_created": len(matches),
        "high_matches": sum(1 for item in matches if item.score >= 70),
        "offers_active": len(offers),
        "follow_ups_overdue": len(overdue),
        "unread_notifications": unread,
        "response_rate": round(response_stage / applied_total * 100) if applied_total else 0,
        "interview_rate": round(interview_stage / applied_total * 100) if applied_total else 0,
        "stage_counts": {status: sum(1 for item in applications if item.status == status) for status in ["wishlist", "applied", "recruiter", "interview", "final", "offer", "accepted", "rejected"]},
        "recommendations": recommendations,
    }
