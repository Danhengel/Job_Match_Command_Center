from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.schemas.profile import ProfileCreate
from app.core.security import get_current_user

router = APIRouter(prefix="/api/profiles", tags=["Career Profiles"])

def serialize(profile: CareerProfile, db: Session):
    resumes = db.query(Resume).filter(Resume.profile_id == profile.id).all()
    primary = next((r.id for r in resumes if r.is_primary), None)
    checks=[bool(profile.name),bool(profile.home_location),bool(profile.target_titles),bool(profile.priority_keywords),
            bool(profile.salary_target or profile.salary_min),bool(resumes),bool(primary),
            any(r.analysis_score is not None for r in resumes)]
    completeness=round(sum(checks)/len(checks)*100)
    best_score=max([r.analysis_score or 0 for r in resumes],default=0)
    return {
        "id": profile.id, "user_id": profile.user_id, "name": profile.name,
        "home_location": profile.home_location, "remote_preferred": profile.remote_preferred,
        "hybrid_preferred": profile.hybrid_preferred, "radius_miles": profile.radius_miles,
        "salary_min": profile.salary_min, "salary_target": profile.salary_target,
        "target_titles": profile.target_titles or [], "priority_keywords": profile.priority_keywords or [],
        "exclusion_keywords": profile.exclusion_keywords or [], "resume_count": len(resumes),
        "primary_resume_id": primary, "completeness": completeness, "best_resume_score": best_score,
    }

@router.get("")
def list_profiles(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(CareerProfile).filter(CareerProfile.user_id == user.id).order_by(CareerProfile.updated_at.desc()).all()
    return [serialize(item, db) for item in items]

@router.post("", status_code=201)
def create_profile(body: ProfileCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = CareerProfile(user_id=user.id, **body.model_dump())
    db.add(profile); db.commit(); db.refresh(profile)
    return serialize(profile, db)

@router.get("/{profile_id}")
def get_profile(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CareerProfile).filter(CareerProfile.id == profile_id, CareerProfile.user_id == user.id).first()
    if not profile: raise HTTPException(404, "Profile not found")
    return serialize(profile, db)

@router.put("/{profile_id}")
def update_profile(profile_id: int, body: ProfileCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CareerProfile).filter(CareerProfile.id == profile_id, CareerProfile.user_id == user.id).first()
    if not profile: raise HTTPException(404, "Profile not found")
    for key, value in body.model_dump().items(): setattr(profile, key, value)
    db.commit(); db.refresh(profile)
    return serialize(profile, db)

@router.delete("/{profile_id}", status_code=204)
def delete_profile(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CareerProfile).filter(CareerProfile.id == profile_id, CareerProfile.user_id == user.id).first()
    if not profile: raise HTTPException(404, "Profile not found")
    db.delete(profile); db.commit()
