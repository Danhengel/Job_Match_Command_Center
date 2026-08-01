from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.application import Application, InterviewPrep
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.tailoring import TailoredResume
from app.models.user import User
from app.schemas.applications import ApplicationCreate, ApplicationUpdate
from app.services.interview_prep import build_interview_prep

router = APIRouter(prefix="/api/applications", tags=["Applications"])
VALID_STATUSES = ["wishlist", "applied", "recruiter", "interview", "final", "offer", "accepted", "rejected"]


def _serialize(app: Application, job: Job, match: JobMatch | None = None):
    return {
        "id": app.id, "profile_id": app.profile_id, "job_id": app.job_id,
        "tailoring_id": app.tailoring_id, "status": app.status, "priority": app.priority,
        "recruiter_name": app.recruiter_name, "recruiter_email": app.recruiter_email,
        "salary_target": app.salary_target, "notes": app.notes, "next_action": app.next_action,
        "next_action_at": app.next_action_at.isoformat() if app.next_action_at else None,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "created_at": app.created_at.isoformat(), "updated_at": app.updated_at.isoformat(),
        "job": {"id": job.id, "title": job.title, "company": job.company, "location": job.location, "url": job.url, "salary": job.salary, "source": job.source, "remote": job.remote},
        "match_score": match.score if match else None,
    }


def _owned(db, user_id, application_id):
    app = db.query(Application).filter(Application.id == application_id, Application.user_id == user_id).first()
    if not app: raise HTTPException(404, "Application not found")
    return app


@router.get("")
def list_applications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Application, Job).join(Job, Job.id == Application.job_id).filter(Application.user_id == user.id).order_by(Application.updated_at.desc()).all()
    output=[]
    for app, job in rows:
        match=db.query(JobMatch).filter(JobMatch.profile_id==app.profile_id, JobMatch.job_id==job.id).first()
        output.append(_serialize(app, job, match))
    return {"statuses": VALID_STATUSES, "applications": output}


@router.post("")
def create_application(body: ApplicationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile=db.query(CareerProfile).filter(CareerProfile.id==body.profile_id, CareerProfile.user_id==user.id).first()
    job=db.query(Job).filter(Job.id==body.job_id).first()
    if not profile or not job: raise HTTPException(404, "Profile or job not found")
    app=db.query(Application).filter(Application.user_id==user.id, Application.job_id==job.id).first()
    if not app:
        app=Application(user_id=user.id, profile_id=profile.id, job_id=job.id, tailoring_id=body.tailoring_id, status=body.status)
        if body.status=="applied": app.applied_at=datetime.utcnow()
        db.add(app)
    elif body.tailoring_id:
        app.tailoring_id=body.tailoring_id
    db.commit(); db.refresh(app)
    match=db.query(JobMatch).filter(JobMatch.profile_id==profile.id, JobMatch.job_id==job.id).first()
    return _serialize(app, job, match)


@router.patch("/{application_id}")
def update_application(application_id: int, body: ApplicationUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app=_owned(db,user.id,application_id)
    values=body.model_dump(exclude_unset=True)
    if "status" in values and values["status"] not in VALID_STATUSES: raise HTTPException(400,"Invalid status")
    old=app.status
    for key,value in values.items(): setattr(app,key,value)
    if old!="applied" and app.status=="applied" and not app.applied_at: app.applied_at=datetime.utcnow()
    db.commit(); db.refresh(app)
    job=db.query(Job).filter(Job.id==app.job_id).first()
    match=db.query(JobMatch).filter(JobMatch.profile_id==app.profile_id, JobMatch.job_id==job.id).first()
    return _serialize(app,job,match)


@router.get("/{application_id}")
def read_application(application_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app=_owned(db,user.id,application_id); job=db.query(Job).filter(Job.id==app.job_id).first()
    match=db.query(JobMatch).filter(JobMatch.profile_id==app.profile_id, JobMatch.job_id==job.id).first()
    prep=db.query(InterviewPrep).filter(InterviewPrep.application_id==app.id).first()
    tailoring=db.query(TailoredResume).filter(TailoredResume.id==app.tailoring_id).first() if app.tailoring_id else None
    return {**_serialize(app,job,match), "tailoring": None if not tailoring else {"id":tailoring.id,"version_name":tailoring.version_name,"ats_score":tailoring.ats_score,"cover_letter":tailoring.cover_letter}, "interview_prep": None if not prep else {"id":prep.id,"opening_statement":prep.opening_statement,"questions":prep.questions or [],"star_prompts":prep.star_prompts or [],"questions_to_ask":prep.questions_to_ask or [],"negotiation_points":prep.negotiation_points or [],"thank_you_email":prep.thank_you_email}}


@router.post("/{application_id}/interview-prep")
def generate_interview_prep(application_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app=_owned(db,user.id,application_id); job=db.query(Job).filter(Job.id==app.job_id).first(); profile=db.query(CareerProfile).filter(CareerProfile.id==app.profile_id).first()
    match=db.query(JobMatch).filter(JobMatch.profile_id==app.profile_id, JobMatch.job_id==job.id).first()
    tailoring=db.query(TailoredResume).filter(TailoredResume.id==app.tailoring_id).first() if app.tailoring_id else None
    data=build_interview_prep(profile.name, job, match, tailoring.selected_evidence if tailoring else [])
    prep=db.query(InterviewPrep).filter(InterviewPrep.application_id==app.id).first()
    if not prep: prep=InterviewPrep(user_id=user.id, application_id=app.id, **data); db.add(prep)
    else:
        for key,value in data.items(): setattr(prep,key,value)
    db.commit(); db.refresh(prep)
    return data
