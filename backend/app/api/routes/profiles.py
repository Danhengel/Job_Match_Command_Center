from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.user import User
from app.schemas.profile import ProfileCreate
from app.services.profile_optimizer import optimize_profile_from_resume
from app.services.resume_analyzer import analyze_resume

router = APIRouter(prefix="/api/profiles", tags=["Career Profiles"])
STORAGE_ROOT = Path("/data/resumes")


def serialize(profile: CareerProfile, db: Session):
    resumes = db.query(Resume).filter(Resume.profile_id == profile.id).all()
    primary = next((r.id for r in resumes if r.is_primary), None)
    checks = [
        bool(profile.name),
        bool(profile.home_location),
        bool(profile.target_titles),
        bool(profile.priority_keywords),
        bool(profile.salary_target or profile.salary_min),
        bool(resumes),
        bool(primary),
        any(r.analysis_score is not None for r in resumes),
    ]
    completeness = round(sum(checks) / len(checks) * 100)
    best_score = max([r.analysis_score or 0 for r in resumes], default=0)
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "name": profile.name,
        "home_location": profile.home_location,
        "remote_preferred": profile.remote_preferred,
        "hybrid_preferred": profile.hybrid_preferred,
        "radius_miles": profile.radius_miles,
        "salary_min": profile.salary_min,
        "salary_target": profile.salary_target,
        "target_titles": profile.target_titles or [],
        "priority_keywords": profile.priority_keywords or [],
        "exclusion_keywords": profile.exclusion_keywords or [],
        "resume_count": len(resumes),
        "primary_resume_id": primary,
        "completeness": completeness,
        "best_resume_score": best_score,
    }


def owned_profile(profile_id: int, user: User, db: Session) -> CareerProfile:
    profile = (
        db.query(CareerProfile)
        .filter(CareerProfile.id == profile_id, CareerProfile.user_id == user.id)
        .first()
    )
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile


def primary_resume(profile_id: int, db: Session) -> Resume:
    row = (
        db.query(Resume)
        .filter(Resume.profile_id == profile_id, Resume.is_primary.is_(True))
        .order_by(Resume.updated_at.desc())
        .first()
    )
    if not row:
        raise HTTPException(400, "Set a primary résumé before optimizing this profile.")
    if not (row.extracted_text or "").strip():
        raise HTTPException(400, "The primary résumé does not contain readable text.")
    return row


def optimization_for(profile: CareerProfile, resume: Resume) -> dict:
    try:
        return optimize_profile_from_resume(
            resume.extracted_text or "",
            current_titles=profile.target_titles or [],
            current_keywords=profile.priority_keywords or [],
            current_exclusions=profile.exclusion_keywords or [],
            remote_preferred=profile.remote_preferred,
            hybrid_preferred=profile.hybrid_preferred,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.get("")
def list_profiles(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == user.id)
        .order_by(CareerProfile.updated_at.desc())
        .all()
    )
    return [serialize(item, db) for item in items]


@router.post("", status_code=201)
def create_profile(
    body: ProfileCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = CareerProfile(user_id=user.id, **body.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return serialize(profile, db)


@router.get("/{profile_id}/optimization-preview")
def preview_profile_optimization(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = owned_profile(profile_id, user, db)
    resume = primary_resume(profile.id, db)
    optimization = optimization_for(profile, resume)
    return {
        "optimization": optimization,
        "source_resume": {
            "id": resume.id,
            "name": resume.name,
            "original_filename": resume.original_filename,
            "analysis_score": resume.analysis_score,
        },
        "preserved_preferences": {
            "profile_name": profile.name,
            "home_location": profile.home_location,
            "radius_miles": profile.radius_miles,
            "salary_min": profile.salary_min,
            "salary_target": profile.salary_target,
        },
    }


@router.post("/{profile_id}/optimize-from-resume")
def apply_profile_optimization(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = owned_profile(profile_id, user, db)
    resume = primary_resume(profile.id, db)
    optimization = optimization_for(profile, resume)

    if optimization["confidence"] == "low":
        raise HTTPException(
            400,
            "CareerNavIQ could not identify a dominant career direction confidently enough to apply changes automatically.",
        )

    profile.target_titles = optimization["recommended_target_titles"]
    profile.priority_keywords = optimization["recommended_priority_keywords"]
    profile.exclusion_keywords = optimization["recommended_exclusion_keywords"]
    profile.remote_preferred = optimization["recommended_remote_preferred"]
    profile.hybrid_preferred = optimization["recommended_hybrid_preferred"]

    analysis = analyze_resume(
        resume.extracted_text or "",
        profile.priority_keywords or [],
        profile.target_titles or [],
    )
    resume.analysis_score = analysis["score"]
    resume.strengths = analysis["strengths"]
    resume.gaps = analysis["gaps"]
    resume.metrics_found = analysis["metrics_found"]
    resume.analysis_summary = analysis["summary"]
    resume.analyzed_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)
    db.refresh(resume)

    return {
        "profile": serialize(profile, db),
        "optimization": optimization,
        "source_resume": {
            "id": resume.id,
            "name": resume.name,
            "original_filename": resume.original_filename,
            "analysis_score": resume.analysis_score,
        },
    }


@router.get("/{profile_id}")
def get_profile(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = owned_profile(profile_id, user, db)
    return serialize(profile, db)


@router.put("/{profile_id}")
def update_profile(
    profile_id: int,
    body: ProfileCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = owned_profile(profile_id, user, db)
    for key, value in body.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return serialize(profile, db)


@router.delete("/{profile_id}", status_code=204)
def delete_profile(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = owned_profile(profile_id, user, db)
    resume_files = [
        STORAGE_ROOT / stored_filename
        for (stored_filename,) in (
            db.query(Resume.stored_filename)
            .filter(Resume.profile_id == profile.id)
            .all()
        )
        if stored_filename
    ]

    db.delete(profile)
    db.commit()

    for path in resume_files:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            # Database deletion has already succeeded. A storage cleanup failure
            # should not resurrect the profile or leave the user stuck.
            pass
