from datetime import datetime
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.application import Application
from app.models.enterprise import CareerPageWatch,CommandCenterSnapshot,PackageExport
from app.models.intelligence import ApplicationPackage
from app.models.recruiting import SalaryPlan
from app.models.tailoring import TailoredResume
from app.models.user import User
from app.schemas.enterprise import CareerPageWatchCreate,CareerPageWatchUpdate
from app.services.enterprise_service import build_command_center,build_strategy_insights
router=APIRouter(prefix="/api/enterprise",tags=["Enterprise"])
@router.get("/command-center")
def command_center(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    data=build_command_center(db,user.id); db.add(CommandCenterSnapshot(user_id=user.id,metrics=data["metrics"],priorities=data["priorities"])); db.commit(); return data
@router.get("/strategy")
def strategy(user:User=Depends(get_current_user),db:Session=Depends(get_db)): return build_strategy_insights(db,user.id)
@router.get("/career-watches")
def watches(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    rows=db.query(CareerPageWatch).filter(CareerPageWatch.user_id==user.id).order_by(CareerPageWatch.created_at.desc()).all(); return [{"id":r.id,"company":r.company,"career_url":r.career_url,"ats_type":r.ats_type,"board_identifier":r.board_identifier,"active":r.active,"notes":r.notes,"last_checked_at":r.last_checked_at.isoformat() if r.last_checked_at else None,"last_job_count":r.last_job_count,"last_error":r.last_error} for r in rows]
@router.post("/career-watches",status_code=201)
def create_watch(body:CareerPageWatchCreate,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=CareerPageWatch(user_id=user.id,**body.model_dump()); db.add(item); db.commit(); db.refresh(item); return {"id":item.id,"company":item.company,"career_url":item.career_url,"ats_type":item.ats_type,"board_identifier":item.board_identifier,"active":item.active,"notes":item.notes}
@router.patch("/career-watches/{watch_id}")
def update_watch(watch_id:int,body:CareerPageWatchUpdate,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(CareerPageWatch).filter(CareerPageWatch.id==watch_id,CareerPageWatch.user_id==user.id).first();
    if not item: raise HTTPException(404,"Career watch not found")
    for k,v in body.model_dump(exclude_unset=True).items(): setattr(item,k,v)
    db.commit(); db.refresh(item); return {"id":item.id,"company":item.company,"career_url":item.career_url,"ats_type":item.ats_type,"board_identifier":item.board_identifier,"active":item.active,"notes":item.notes}
@router.delete("/career-watches/{watch_id}")
def delete_watch(watch_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(CareerPageWatch).filter(CareerPageWatch.id==watch_id,CareerPageWatch.user_id==user.id).first();
    if item: db.delete(item); db.commit()
    return {"ok":True}
@router.post("/applications/{application_id}/export")
def export_package(application_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    app=db.query(Application).filter(Application.id==application_id,Application.user_id==user.id).first();
    if not app: raise HTTPException(404,"Application not found")
    pkg=db.query(ApplicationPackage).filter(ApplicationPackage.application_id==app.id).first(); salary=db.query(SalaryPlan).filter(SalaryPlan.application_id==app.id).first(); tailoring=db.query(TailoredResume).filter(TailoredResume.id==app.tailoring_id).first() if app.tailoring_id else None
    manifest={"application_id":app.id,"has_tailored_resume":bool(tailoring),"has_application_package":bool(pkg),"has_salary_plan":bool(salary),"assets":{"tailored_resume_id":tailoring.id if tailoring else None,"application_package_id":pkg.id if pkg else None,"salary_plan_id":salary.id if salary else None},"generated_at":datetime.utcnow().isoformat()}
    item=PackageExport(user_id=user.id,application_id=app.id,manifest=manifest); db.add(item); db.commit(); db.refresh(item); return {"id":item.id,"application_id":item.application_id,"manifest":item.manifest,"created_at":item.created_at.isoformat()}
