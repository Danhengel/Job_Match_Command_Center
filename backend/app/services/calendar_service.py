from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.recruiting import InterviewEvent, RecruiterContact


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def build_calendar_timeline(
    db: Session,
    user_id: int,
    days_before: int = 14,
    days_after: int = 60,
) -> dict:
    """Build a user-owned calendar timeline from existing CareerOS records."""
    now = datetime.utcnow()
    starts_at = now - timedelta(days=max(0, days_before))
    ends_at = now + timedelta(days=max(1, min(days_after, 365)))
    events: list[dict] = []

    interviews = db.query(InterviewEvent).filter(
        InterviewEvent.user_id == user_id,
        InterviewEvent.starts_at >= starts_at,
        InterviewEvent.starts_at <= ends_at,
    ).all()
    for item in interviews:
        events.append({
            "id": f"interview-{item.id}",
            "record_id": item.id,
            "application_id": item.application_id,
            "kind": "interview",
            "title": item.title,
            "detail": item.event_type.replace("_", " ").title(),
            "starts_at": _iso(item.starts_at),
            "ends_at": _iso(item.ends_at),
            "completed": item.completed,
            "location": item.location,
            "meeting_url": item.meeting_url,
            "link": f"/applications/{item.application_id}",
            "secondary_link": "/interview-coach",
            "secondary_action": "Practice",
        })

    applications = db.query(Application).filter(
        Application.user_id == user_id,
        Application.next_action_at.is_not(None),
        Application.next_action_at >= starts_at,
        Application.next_action_at <= ends_at,
    ).all()
    for item in applications:
        events.append({
            "id": f"application-{item.id}",
            "record_id": item.id,
            "application_id": item.id,
            "kind": "application_follow_up",
            "title": item.next_action or "Application follow-up",
            "detail": f"Application stage: {item.status}",
            "starts_at": _iso(item.next_action_at),
            "ends_at": None,
            "completed": False,
            "location": "",
            "meeting_url": "",
            "link": f"/applications/{item.id}",
            "secondary_link": "/outreach",
            "secondary_action": "Draft outreach",
        })

    recruiters = db.query(RecruiterContact).filter(
        RecruiterContact.user_id == user_id,
        RecruiterContact.next_follow_up_at.is_not(None),
        RecruiterContact.next_follow_up_at >= starts_at,
        RecruiterContact.next_follow_up_at <= ends_at,
    ).all()
    for item in recruiters:
        events.append({
            "id": f"recruiter-{item.id}",
            "record_id": item.id,
            "application_id": None,
            "kind": "recruiter_follow_up",
            "title": f"Follow up with {item.name}",
            "detail": item.company,
            "starts_at": _iso(item.next_follow_up_at),
            "ends_at": None,
            "completed": False,
            "location": "",
            "meeting_url": "",
            "link": "/crm",
            "secondary_link": "/outreach",
            "secondary_action": "Draft message",
        })

    events.sort(key=lambda item: item["starts_at"] or "")
    upcoming = [event for event in events if event["starts_at"] and event["starts_at"] >= now.isoformat()]
    overdue = [
        event for event in events
        if event["starts_at"] and event["starts_at"] < now.isoformat() and not event["completed"]
    ]
    today = now.date()
    today_items = [
        event for event in events
        if event["starts_at"] and datetime.fromisoformat(event["starts_at"]).date() == today
    ]

    counts: dict[str, int] = {}
    for event in events:
        counts[event["kind"]] = counts.get(event["kind"], 0) + 1

    agenda = []
    if overdue:
        agenda.append({
            "priority": "urgent",
            "title": f"Resolve {len(overdue)} overdue item{'s' if len(overdue) != 1 else ''}",
            "detail": "Start with overdue application and recruiter follow-ups.",
            "link": overdue[0]["link"],
        })
    if today_items:
        agenda.append({
            "priority": "today",
            "title": f"Complete {len(today_items)} scheduled item{'s' if len(today_items) != 1 else ''} today",
            "detail": "Review meeting details and prepare any messages before the scheduled time.",
            "link": today_items[0]["link"],
        })
    next_interview = next((event for event in upcoming if event["kind"] == "interview"), None)
    if next_interview:
        agenda.append({
            "priority": "prepare",
            "title": f"Prepare for {next_interview['title']}",
            "detail": "Confirm logistics, review the role, and practice your strongest examples.",
            "link": next_interview["secondary_link"],
        })
    if not agenda:
        agenda.append({
            "priority": "plan",
            "title": "Your calendar is clear",
            "detail": "Use the time to review high-match jobs or schedule your next follow-up.",
            "link": "/jobs",
        })

    return {
        "generated_at": now.isoformat(),
        "range": {"starts_at": starts_at.isoformat(), "ends_at": ends_at.isoformat()},
        "counts": counts,
        "total_events": len(events),
        "upcoming_count": len(upcoming),
        "overdue_count": len(overdue),
        "today_count": len(today_items),
        "agenda": agenda,
        "events": events,
    }
