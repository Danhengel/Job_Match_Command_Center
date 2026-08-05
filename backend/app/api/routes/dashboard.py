from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.job import JobMatch
from app.models.application import Application
from app.models.tailoring import TailoredResume
from app.services.daily_brief_service import build_daily_brief

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def completeness(profile, resumes):
    checks=[bool(profile.name),bool(profile.home_location),bool(profile.target_titles),bool(profile.priority_keywords),bool(profile.salary_target or profile.salary_min),bool(resumes),any(r.is_primary for r in resumes),any(r.analysis_score is not None for r in resumes)]
    return round(sum(checks)/len(checks)*100)

@router.get("")
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profiles=db.query(CareerProfile).filter(CareerProfile.user_id==user.id).all(); pdata=[]; all_resumes=[]
    for p in profiles:
        resumes=db.query(Resume).filter(Resume.profile_id==p.id).all(); all_resumes.extend(resumes)
        pdata.append({"id":p.id,"name":p.name,"completeness":completeness(p,resumes),"resume_count":len(resumes),"has_primary":any(r.is_primary for r in resumes),"best_resume_score":max([r.analysis_score or 0 for r in resumes],default=0)})
    apps=db.query(Application).filter(Application.user_id==user.id).all()
    tailorings=db.query(TailoredResume).filter(TailoredResume.user_id==user.id).all()
    matches=[]
    for p in profiles: matches += db.query(JobMatch).filter(JobMatch.profile_id==p.id).all()
    status_counts={s:sum(1 for a in apps if a.status==s) for s in ["wishlist","applied","recruiter","interview","final","offer","accepted","rejected"]}
    due=[a for a in apps if a.next_action_at and a.next_action_at <= datetime.utcnow()]
    recent=sorted(all_resumes,key=lambda r:r.created_at,reverse=True)[:5]
    return {"user_name": user.full_name,"resume_count":len(all_resumes),"ready_profiles":sum(1 for p in pdata if p["has_primary"]),"analyzed_resumes":sum(1 for r in all_resumes if r.analysis_score is not None),"average_completeness":round(sum(p["completeness"] for p in pdata)/len(pdata)) if pdata else 0,"job_match_count":len(matches),"high_match_count":sum(1 for m in matches if m.score>=70),"application_count":len(apps),"interview_count":status_counts["interview"]+status_counts["final"],"offer_count":status_counts["offer"]+status_counts["accepted"],"tailored_resume_count":len(tailorings),"followups_due":len(due),"status_counts":status_counts,"profiles":pdata,"recent_activity":[{"type":"resume_uploaded","label":f"{r.name} uploaded","detail":r.original_filename,"profile_id":r.profile_id,"created_at":r.created_at.isoformat()} for r in recent]}


@router.get("/daily-brief")
def daily_brief(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_daily_brief(db, user.id, user.full_name)
