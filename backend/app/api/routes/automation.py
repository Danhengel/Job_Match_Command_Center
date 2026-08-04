from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.automation import Notification, SavedSearch
from app.models.profile import CareerProfile
from app.models.user import User
from app.schemas.automation import SavedSearchCreate, SavedSearchUpdate
from app.services.automation_service import build_daily_digest, refresh_smart_notifications, run_saved_search
from app.services.calendar_service import build_calendar_timeline
from app.services.report_service import build_weekly_report

router = APIRouter(prefix="/api/automation", tags=["Automation"])


def _serialize_search(item: SavedSearch):
    return {"id":item.id,"profile_id":item.profile_id,"name":item.name,"titles":item.titles or [],"location":item.location,"minimum_score":item.minimum_score,"use_catalog":item.use_catalog,"use_remotive":item.use_remotive,"use_jsearch":item.use_jsearch,"active":item.active,"cadence":item.cadence,"last_run_at":item.last_run_at.isoformat() if item.last_run_at else None,"last_result_count":item.last_result_count,"created_at":item.created_at.isoformat()}


def _serialize_notification(item: Notification):
    return {"id":item.id,"kind":item.kind,"title":item.title,"message":item.message,"link":item.link,"read":item.read,"metadata":item.metadata_json or {},"created_at":item.created_at.isoformat()}


@router.get("/saved-searches")
def saved_searches(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows=db.query(SavedSearch).filter(SavedSearch.user_id==user.id).order_by(SavedSearch.created_at.desc()).all()
    return [_serialize_search(row) for row in rows]


@router.post("/saved-searches", status_code=201)
def create_saved_search(body: SavedSearchCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile=db.query(CareerProfile).filter(CareerProfile.id==body.profile_id,CareerProfile.user_id==user.id).first()
    if not profile: raise HTTPException(status_code=404,detail="Profile not found")
    item=SavedSearch(user_id=user.id,**body.model_dump()); db.add(item); db.commit(); db.refresh(item)
    return _serialize_search(item)


@router.patch("/saved-searches/{search_id}")
def update_saved_search(search_id:int,body:SavedSearchUpdate,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(SavedSearch).filter(SavedSearch.id==search_id,SavedSearch.user_id==user.id).first()
    if not item: raise HTTPException(status_code=404,detail="Saved search not found")
    for key,value in body.model_dump(exclude_unset=True).items(): setattr(item,key,value)
    db.commit(); db.refresh(item); return _serialize_search(item)


@router.post("/saved-searches/{search_id}/run")
def run_search(search_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(SavedSearch).filter(SavedSearch.id==search_id,SavedSearch.user_id==user.id).first()
    if not item: raise HTTPException(status_code=404,detail="Saved search not found")
    return run_saved_search(db,item)


@router.delete("/saved-searches/{search_id}")
def delete_saved_search(search_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(SavedSearch).filter(SavedSearch.id==search_id,SavedSearch.user_id==user.id).first()
    if item: db.delete(item); db.commit()
    return {"ok":True}


@router.get("/notifications")
def notifications(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    rows=db.query(Notification).filter(Notification.user_id==user.id).order_by(Notification.created_at.desc()).limit(100).all()
    return [_serialize_notification(item) for item in rows]


@router.post("/notifications/refresh")
def refresh_notifications(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    created=refresh_smart_notifications(db,user.id); return {"ok":True,**created}


@router.post("/notifications/{notification_id}/read")
def mark_read(notification_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(Notification).filter(Notification.id==notification_id,Notification.user_id==user.id).first()
    if item: item.read=True; db.commit()
    return {"ok":True}


@router.delete("/notifications/{notification_id}")
def dismiss_notification(notification_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(Notification).filter(Notification.id==notification_id,Notification.user_id==user.id).first()
    if item: db.delete(item); db.commit()
    return {"ok":True}


@router.post("/notifications/read-all")
def mark_all_read(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    db.query(Notification).filter(Notification.user_id==user.id,Notification.read.is_(False)).update({"read":True}); db.commit()
    return {"ok":True}


@router.get("/digest")
def digest(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    return build_daily_digest(db,user.id)


@router.get("/weekly-report")
def weekly_report(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    return build_weekly_report(db,user.id)


@router.get("/calendar")
def calendar_timeline(days_before:int=Query(default=14,ge=0,le=90),days_after:int=Query(default=60,ge=1,le=365),user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    return build_calendar_timeline(db,user.id,days_before=days_before,days_after=days_after)
