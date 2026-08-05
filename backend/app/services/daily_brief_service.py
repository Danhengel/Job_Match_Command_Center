from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.automation import Notification
from app.models.job import JobMatch
from app.models.profile import CareerProfile
from app.models.recruiting import InterviewEvent, RecruiterContact
from app.models.resume import Resume


ACTIVE_STATUSES = {"wishlist", "applied", "recruiter", "interview", "final", "offer"}
ENGAGED_STATUSES = {"recruiter", "interview", "final", "offer", "accepted"}


def _profile_readiness(profile: CareerProfile, resumes: list[Resume]) -> int:
    checks = [
        bool(profile.name),
        bool(profile.home_location),
        bool(profile.target_titles),
        bool(profile.priority_keywords),
        bool(profile.salary_target or profile.salary_min),
        bool(resumes),
        any(item.is_primary for item in resumes),
        any(item.analysis_score is not None for item in resumes),
    ]
    return round(sum(checks) / len(checks) * 100)


def build_daily_brief(db: Session, user_id: int, user_name: str = "") -> dict:
    now = datetime.utcnow()
    tomorrow_end = now + timedelta(hours=48)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    profiles = db.query(CareerProfile).filter(CareerProfile.user_id == user_id).all()
    profile_ids = [item.id for item in profiles]
    resumes = db.query(Resume).filter(Resume.profile_id.in_(profile_ids)).all() if profile_ids else []
    applications = db.query(Application).filter(Application.user_id == user_id).all()
    recruiters = db.query(RecruiterContact).filter(RecruiterContact.user_id == user_id).all()
    interviews = db.query(InterviewEvent).filter(
        InterviewEvent.user_id == user_id,
        InterviewEvent.completed.is_(False),
        InterviewEvent.starts_at >= now,
    ).order_by(InterviewEvent.starts_at.asc()).all()
    unread = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read.is_(False),
    ).all()

    matches = db.query(JobMatch).filter(JobMatch.profile_id.in_(profile_ids)).all() if profile_ids else []
    new_matches = sum(1 for item in unread if item.kind in {"high_match", "saved_search"})
    overdue_apps = [item for item in applications if item.next_action_at and item.next_action_at <= now]
    overdue_recruiters = [item for item in recruiters if item.next_follow_up_at and item.next_follow_up_at <= now]
    interviews_next_48h = [item for item in interviews if item.starts_at <= tomorrow_end]
    applications_this_week = sum(1 for item in applications if item.created_at >= week_start or (item.applied_at and item.applied_at >= week_start))

    readiness = round(sum(_profile_readiness(profile, [r for r in resumes if r.profile_id == profile.id]) for profile in profiles) / len(profiles)) if profiles else 0
    active_apps = sum(1 for item in applications if item.status in ACTIVE_STATUSES)
    engaged = sum(1 for item in applications if item.status in ENGAGED_STATUSES)
    response_rate = round(engaged / len(applications) * 100) if applications else 0
    practice_signal = 100 if interviews else 45
    follow_up_signal = 100 if not overdue_apps and not overdue_recruiters else 55
    activity_signal = min(100, round(applications_this_week / 20 * 100))
    health = round((readiness + activity_signal + practice_signal + follow_up_signal + min(100, response_rate * 3)) / 5)

    priority = {
        "kind": "search",
        "title": "Run a targeted job search",
        "detail": "Refresh your opportunity pipeline and review the strongest matches.",
        "link": "/jobs",
        "action": "Search jobs",
    }
    if interviews_next_48h:
        event = interviews_next_48h[0]
        priority = {
            "kind": "interview",
            "title": f"Prepare for {event.title}",
            "detail": f"Scheduled for {event.starts_at.isoformat()}.",
            "link": "/interview-coach",
            "action": "Practice now",
        }
    elif overdue_apps or overdue_recruiters:
        total = len(overdue_apps) + len(overdue_recruiters)
        priority = {
            "kind": "follow_up",
            "title": f"Complete {total} overdue follow-up{'s' if total != 1 else ''}",
            "detail": "Keep active applications and recruiter relationships moving.",
            "link": "/crm",
            "action": "Review follow-ups",
        }
    elif new_matches:
        priority = {
            "kind": "opportunity",
            "title": f"Review {new_matches} new opportunity alert{'s' if new_matches != 1 else ''}",
            "detail": "Prioritize recent strong matches before they age.",
            "link": "/jobs",
            "action": "Review matches",
        }

    return {
        "user_name": user_name,
        "generated_at": now.isoformat(),
        "career_health": health,
        "summary": {
            "new_match_alerts": new_matches,
            "high_match_total": sum(1 for item in matches if item.score >= 70),
            "follow_ups_due": len(overdue_apps) + len(overdue_recruiters),
            "interviews_next_48h": len(interviews_next_48h),
            "active_applications": active_apps,
            "applications_this_week": applications_this_week,
            "weekly_application_progress": activity_signal,
            "unread_notifications": len(unread),
        },
        "top_priority": priority,
        "quick_actions": [
            {"label": "View jobs", "link": "/jobs"},
            {"label": "Open applications", "link": "/applications"},
            {"label": "Practice interview", "link": "/interview-coach"},
            {"label": "View calendar", "link": "/calendar"},
        ],
        "methodology": "Career health is a planning score based on profile readiness, weekly activity, interview preparation signal, follow-up workload, and recorded application engagement.",
    }
