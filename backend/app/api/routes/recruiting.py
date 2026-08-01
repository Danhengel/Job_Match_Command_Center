from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.application import Application
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.recruiting import InterviewEvent, RecruiterContact, SalaryPlan
from app.models.user import User
from app.schemas.recruiting import (
    InterviewEventCreate,
    InterviewEventUpdate,
    RecruiterCreate,
    RecruiterUpdate,
    SalaryPlanRequest,
)
from app.services.recruiting_assistant import (
    build_apply_checklist,
    build_salary_plan,
    explain_match,
)


router = APIRouter(prefix="/api/recruiting", tags=["Recruiting Assistant"])


def _owned_application(db: Session, user_id: int, application_id: int):
    item = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")
    return item


def _serialize_recruiter(item: RecruiterContact):
    return {
        "id": item.id,
        "company": item.company,
        "name": item.name,
        "title": item.title,
        "email": item.email,
        "phone": item.phone,
        "linkedin_url": item.linkedin_url,
        "status": item.status,
        "relationship_score": item.relationship_score,
        "notes": item.notes,
        "last_contact_at": item.last_contact_at.isoformat() if item.last_contact_at else None,
        "next_follow_up_at": item.next_follow_up_at.isoformat() if item.next_follow_up_at else None,
        "created_at": item.created_at.isoformat(),
    }


def _serialize_event(item: InterviewEvent):
    return {
        "id": item.id,
        "application_id": item.application_id,
        "event_type": item.event_type,
        "title": item.title,
        "starts_at": item.starts_at.isoformat(),
        "ends_at": item.ends_at.isoformat() if item.ends_at else None,
        "location": item.location,
        "meeting_url": item.meeting_url,
        "notes": item.notes,
        "reminder_minutes": item.reminder_minutes,
        "completed": item.completed,
    }


@router.get("/recruiters")
def recruiters(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(RecruiterContact).filter(
        RecruiterContact.user_id == user.id
    ).order_by(RecruiterContact.updated_at.desc()).all()
    return [_serialize_recruiter(row) for row in rows]


@router.post("/recruiters", status_code=201)
def create_recruiter(
    body: RecruiterCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = RecruiterContact(user_id=user.id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize_recruiter(item)


@router.patch("/recruiters/{recruiter_id}")
def update_recruiter(
    recruiter_id: int,
    body: RecruiterUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(RecruiterContact).filter(
        RecruiterContact.id == recruiter_id,
        RecruiterContact.user_id == user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return _serialize_recruiter(item)


@router.delete("/recruiters/{recruiter_id}")
def delete_recruiter(
    recruiter_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(RecruiterContact).filter(
        RecruiterContact.id == recruiter_id,
        RecruiterContact.user_id == user.id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}


@router.get("/interviews")
def interviews(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(InterviewEvent).filter(
        InterviewEvent.user_id == user.id
    ).order_by(InterviewEvent.starts_at.asc()).all()
    return [_serialize_event(row) for row in rows]


@router.post("/interviews", status_code=201)
def create_interview(
    body: InterviewEventCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _owned_application(db, user.id, body.application_id)
    item = InterviewEvent(user_id=user.id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize_event(item)


@router.patch("/interviews/{event_id}")
def update_interview(
    event_id: int,
    body: InterviewEventUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(InterviewEvent).filter(
        InterviewEvent.id == event_id,
        InterviewEvent.user_id == user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Interview event not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return _serialize_event(item)


@router.delete("/interviews/{event_id}")
def delete_interview(
    event_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(InterviewEvent).filter(
        InterviewEvent.id == event_id,
        InterviewEvent.user_id == user.id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}


@router.get("/applications/{application_id}/match-explanation")
def match_explanation(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = _owned_application(db, user.id, application_id)
    match = db.query(JobMatch).filter(
        JobMatch.profile_id == app.profile_id,
        JobMatch.job_id == app.job_id,
    ).first()
    return explain_match(match)


@router.get("/applications/{application_id}/apply-checklist")
def apply_checklist(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = _owned_application(db, user.id, application_id)
    job = db.query(Job).filter(Job.id == app.job_id).first()
    match = db.query(JobMatch).filter(
        JobMatch.profile_id == app.profile_id,
        JobMatch.job_id == app.job_id,
    ).first()
    return build_apply_checklist(app, job, match)


@router.post("/applications/{application_id}/salary-plan")
def salary_plan(
    application_id: int,
    body: SalaryPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = _owned_application(db, user.id, application_id)
    job = db.query(Job).filter(Job.id == app.job_id).first()
    profile = db.query(CareerProfile).filter(
        CareerProfile.id == app.profile_id
    ).first()
    match = db.query(JobMatch).filter(
        JobMatch.profile_id == app.profile_id,
        JobMatch.job_id == app.job_id,
    ).first()

    data = build_salary_plan(profile, job, match, body)

    item = db.query(SalaryPlan).filter(
        SalaryPlan.application_id == app.id
    ).first()
    if not item:
        item = SalaryPlan(
            user_id=user.id,
            application_id=app.id,
            **data,
        )
        db.add(item)
    else:
        for key, value in data.items():
            setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return {
        "id": item.id,
        "application_id": item.application_id,
        "target_base": item.target_base,
        "minimum_base": item.minimum_base,
        "target_bonus_pct": item.target_bonus_pct,
        "total_comp_target": item.total_comp_target,
        "rationale": item.rationale or [],
        "negotiation_points": item.negotiation_points or [],
        "updated_at": item.updated_at.isoformat(),
    }


@router.get("/applications/{application_id}/salary-plan")
def read_salary_plan(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = _owned_application(db, user.id, application_id)
    item = db.query(SalaryPlan).filter(
        SalaryPlan.application_id == app.id
    ).first()
    if not item:
        return None

    return {
        "id": item.id,
        "application_id": item.application_id,
        "target_base": item.target_base,
        "minimum_base": item.minimum_base,
        "target_bonus_pct": item.target_bonus_pct,
        "total_comp_target": item.total_comp_target,
        "rationale": item.rationale or [],
        "negotiation_points": item.negotiation_points or [],
        "updated_at": item.updated_at.isoformat(),
    }
