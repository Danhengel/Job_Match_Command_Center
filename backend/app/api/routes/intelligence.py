from collections import Counter, defaultdict
from datetime import datetime
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.application import Application
from app.models.intelligence import (
    ApplicationPackage,
    CareerCoachMessage,
    CompanyWatch,
)
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.tailoring import TailoredResume
from app.models.user import User
from app.schemas.intelligence import CoachRequest, CompanyWatchRequest
from app.services.career_intelligence import (
    answer_career_question,
    build_application_package,
    build_company_summary,
)


router = APIRouter(prefix="/api/intelligence", tags=["Career Intelligence"])


def _owned_application(db, user_id, application_id):
    app = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == user_id,
        )
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


def _serialize_package(item):
    return {
        "id": item.id,
        "application_id": item.application_id,
        "fit_score": item.fit_score,
        "fit_recommendation": item.fit_recommendation,
        "fit_summary": item.fit_summary,
        "strengths": item.strengths or [],
        "gaps": item.gaps or [],
        "executive_summary": item.executive_summary,
        "recruiter_email": item.recruiter_email,
        "linkedin_message": item.linkedin_message,
        "plan_30_60_90": item.plan_30_60_90 or [],
        "salary_strategy": item.salary_strategy or [],
        "generated_at": item.generated_at.isoformat(),
        "updated_at": item.updated_at.isoformat(),
    }


@router.post("/applications/{application_id}/package")
def generate_application_package(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = _owned_application(db, user.id, application_id)
    job = db.query(Job).filter(Job.id == app.job_id).first()
    profile = (
        db.query(CareerProfile)
        .filter(CareerProfile.id == app.profile_id)
        .first()
    )
    match = (
        db.query(JobMatch)
        .filter(
            JobMatch.profile_id == app.profile_id,
            JobMatch.job_id == app.job_id,
        )
        .first()
    )
    tailoring = (
        db.query(TailoredResume)
        .filter(TailoredResume.id == app.tailoring_id)
        .first()
        if app.tailoring_id
        else None
    )

    data = build_application_package(
        candidate_name=profile.name,
        profile=profile,
        job=job,
        match=match,
        tailoring=tailoring,
    )

    item = (
        db.query(ApplicationPackage)
        .filter(ApplicationPackage.application_id == app.id)
        .first()
    )
    if not item:
        item = ApplicationPackage(
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
    return _serialize_package(item)


@router.get("/applications/{application_id}/package")
def read_application_package(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = _owned_application(db, user.id, application_id)
    item = (
        db.query(ApplicationPackage)
        .filter(ApplicationPackage.application_id == app.id)
        .first()
    )
    return None if not item else _serialize_package(item)


@router.get("/companies")
def companies(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profiles = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == user.id)
        .all()
    )
    profile_ids = [p.id for p in profiles]

    matches = (
        db.query(JobMatch, Job)
        .join(Job, Job.id == JobMatch.job_id)
        .filter(JobMatch.profile_id.in_(profile_ids))
        .all()
        if profile_ids
        else []
    )
    apps = (
        db.query(Application, Job)
        .join(Job, Job.id == Application.job_id)
        .filter(Application.user_id == user.id)
        .all()
    )
    watches = (
        db.query(CompanyWatch)
        .filter(CompanyWatch.user_id == user.id)
        .all()
    )

    jobs_by_company = defaultdict(dict)
    apps_by_company = defaultdict(list)
    watches_by_company = defaultdict(list)

    for _, job in matches:
        jobs_by_company[job.company][job.id] = job
    for app, job in apps:
        apps_by_company[job.company].append(app)
        jobs_by_company[job.company][job.id] = job
    for watch in watches:
        watches_by_company[watch.company].append(watch)

    company_names = sorted(
        set(jobs_by_company)
        | set(apps_by_company)
        | set(watches_by_company)
    )

    output = [
        build_company_summary(
            company=name,
            jobs=list(jobs_by_company[name].values()),
            applications=apps_by_company[name],
            watches=watches_by_company[name],
        )
        for name in company_names
    ]
    output.sort(
        key=lambda x: (
            x["watched"],
            x["application_count"],
            x["open_job_count"],
        ),
        reverse=True,
    )
    return output


@router.get("/companies/{company}")
def company_detail(
    company: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = unquote(company)
    profiles = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == user.id)
        .all()
    )
    profile_ids = [p.id for p in profiles]

    jobs = (
        db.query(Job)
        .join(JobMatch, JobMatch.job_id == Job.id)
        .filter(
            JobMatch.profile_id.in_(profile_ids),
            Job.company == name,
        )
        .all()
        if profile_ids
        else []
    )
    apps = (
        db.query(Application)
        .join(Job, Job.id == Application.job_id)
        .filter(
            Application.user_id == user.id,
            Job.company == name,
        )
        .all()
    )
    watches = (
        db.query(CompanyWatch)
        .filter(
            CompanyWatch.user_id == user.id,
            CompanyWatch.company == name,
        )
        .all()
    )
    summary = build_company_summary(name, jobs, apps, watches)
    summary["jobs"] = [
        {
            "id": job.id,
            "title": job.title,
            "location": job.location,
            "salary": job.salary,
            "remote": job.remote,
            "source": job.source,
            "url": job.url,
        }
        for job in jobs
    ]
    return summary


@router.post("/companies/watch")
def watch_company(
    body: CompanyWatchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CompanyWatch)
        .filter(
            CompanyWatch.user_id == user.id,
            CompanyWatch.company == body.company,
        )
        .first()
    )
    if not item:
        item = CompanyWatch(
            user_id=user.id,
            company=body.company,
            notes=body.notes,
            active=True,
        )
        db.add(item)
    else:
        item.active = True
        item.notes = body.notes
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "company": item.company,
        "active": item.active,
        "notes": item.notes,
    }


@router.delete("/companies/watch/{company}")
def unwatch_company(
    company: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = unquote(company)
    item = (
        db.query(CompanyWatch)
        .filter(
            CompanyWatch.user_id == user.id,
            CompanyWatch.company == name,
        )
        .first()
    )
    if item:
        item.active = False
        db.commit()
    return {"ok": True}


@router.post("/coach")
def coach(
    body: CoachRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = None
    application = None
    job = None
    match = None
    tailoring = None

    if body.profile_id:
        profile = (
            db.query(CareerProfile)
            .filter(
                CareerProfile.id == body.profile_id,
                CareerProfile.user_id == user.id,
            )
            .first()
        )
    if body.application_id:
        application = _owned_application(
            db, user.id, body.application_id
        )
        profile = (
            db.query(CareerProfile)
            .filter(CareerProfile.id == application.profile_id)
            .first()
        )
        job = db.query(Job).filter(Job.id == application.job_id).first()
        match = (
            db.query(JobMatch)
            .filter(
                JobMatch.profile_id == application.profile_id,
                JobMatch.job_id == application.job_id,
            )
            .first()
        )
        tailoring = (
            db.query(TailoredResume)
            .filter(TailoredResume.id == application.tailoring_id)
            .first()
            if application.tailoring_id
            else None
        )

    answer = answer_career_question(
        question=body.question,
        profile=profile,
        application=application,
        job=job,
        match=match,
        tailoring=tailoring,
    )

    message = CareerCoachMessage(
        user_id=user.id,
        profile_id=profile.id if profile else None,
        application_id=application.id if application else None,
        question=body.question,
        answer=answer,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "question": message.question,
        "answer": message.answer,
        "created_at": message.created_at.isoformat(),
    }


@router.get("/coach/history")
def coach_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(CareerCoachMessage)
        .filter(CareerCoachMessage.user_id == user.id)
        .order_by(CareerCoachMessage.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": row.id,
            "question": row.question,
            "answer": row.answer,
            "profile_id": row.profile_id,
            "application_id": row.application_id,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


@router.get("/analytics")
def analytics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profiles = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == user.id)
        .all()
    )
    profile_ids = [p.id for p in profiles]
    apps = (
        db.query(Application, Job)
        .join(Job, Job.id == Application.job_id)
        .filter(Application.user_id == user.id)
        .all()
    )
    matches = (
        db.query(JobMatch, Job)
        .join(Job, Job.id == JobMatch.job_id)
        .filter(JobMatch.profile_id.in_(profile_ids))
        .all()
        if profile_ids
        else []
    )

    status_counts = Counter(app.status for app, _ in apps)
    company_counts = Counter(job.company for _, job in apps)
    title_counts = Counter(job.title for _, job in apps)
    score_bands = {"0-49": 0, "50-64": 0, "65-79": 0, "80-100": 0}
    for match, _ in matches:
        if match.score < 50:
            score_bands["0-49"] += 1
        elif match.score < 65:
            score_bands["50-64"] += 1
        elif match.score < 80:
            score_bands["65-79"] += 1
        else:
            score_bands["80-100"] += 1

    total_apps = len(apps)
    interviews = (
        status_counts["interview"]
        + status_counts["final"]
        + status_counts["offer"]
        + status_counts["accepted"]
    )
    offers = status_counts["offer"] + status_counts["accepted"]

    return {
        "total_matches": len(matches),
        "average_match_score": (
            round(sum(match.score for match, _ in matches) / len(matches))
            if matches
            else 0
        ),
        "total_applications": total_apps,
        "interviews": interviews,
        "offers": offers,
        "interview_conversion": (
            round(interviews / total_apps * 100)
            if total_apps
            else 0
        ),
        "offer_conversion": (
            round(offers / total_apps * 100)
            if total_apps
            else 0
        ),
        "status_counts": dict(status_counts),
        "score_bands": score_bands,
        "top_companies": [
            {"company": company, "count": count}
            for company, count in company_counts.most_common(10)
        ],
        "top_titles": [
            {"title": title, "count": count}
            for title, count in title_counts.most_common(10)
        ],
    }
