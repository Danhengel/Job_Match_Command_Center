from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.core.security import get_current_user
from app.services.resume_parser import extract_text, ResumeValidationError
from app.services.resume_analyzer import analyze_resume
from datetime import datetime

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])
STORAGE_ROOT = Path("/data/resumes")
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

def owned_profile(profile_id: int, user: User, db: Session):
    profile = db.query(CareerProfile).filter(CareerProfile.id == profile_id, CareerProfile.user_id == user.id).first()
    if not profile: raise HTTPException(404, "Profile not found")
    return profile

def serialize(r: Resume):
    return {"id":r.id,"profile_id":r.profile_id,"name":r.name,"original_filename":r.original_filename,
            "mime_type":r.mime_type,"file_size":r.file_size,"is_primary":r.is_primary,
            "extracted_text_preview":(r.extracted_text or "")[:500],
            "analysis_score":r.analysis_score,"strengths":r.strengths or [],"gaps":r.gaps or [],
            "metrics_found":r.metrics_found or [],"analysis_summary":r.analysis_summary or "",
            "analyzed_at":r.analyzed_at.isoformat() if r.analyzed_at else None}

@router.get("/profile/{profile_id}")
def list_resumes(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    owned_profile(profile_id,user,db)
    rows=db.query(Resume).filter(Resume.profile_id==profile_id).order_by(Resume.is_primary.desc(),Resume.created_at.desc()).all()
    return [serialize(r) for r in rows]

@router.post("/upload", status_code=201)
async def upload_resume(profile_id: int = Form(...), name: str = Form(...), make_primary: bool = Form(False),
                        file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    owned_profile(profile_id,user,db)
    content=await file.read()
    try: text=extract_text(file.filename or "resume",content)
    except ResumeValidationError as exc: raise HTTPException(400,str(exc))
    except Exception as exc: raise HTTPException(400,f"Could not read the resume: {exc}")
    if not text.strip(): raise HTTPException(400,"No readable text was found in the resume")
    suffix=Path(file.filename or "resume").suffix.lower()
    stored=f"{user.id}_{profile_id}_{uuid4().hex}{suffix}"
    (STORAGE_ROOT/stored).write_bytes(content)
    existing_count=db.query(Resume).filter(Resume.profile_id==profile_id).count()
    primary=make_primary or existing_count==0
    if primary:
        db.query(Resume).filter(Resume.profile_id==profile_id).update({Resume.is_primary:False})
    row=Resume(profile_id=profile_id,name=name.strip(),original_filename=file.filename or "resume",
               stored_filename=stored,mime_type=file.content_type or "application/octet-stream",
               file_size=len(content),extracted_text=text,is_primary=primary)
    db.add(row); db.commit(); db.refresh(row)
    return serialize(row)

@router.post("/{resume_id}/primary")
def make_primary(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row=(db.query(Resume).join(CareerProfile).filter(Resume.id==resume_id,CareerProfile.user_id==user.id).first())
    if not row: raise HTTPException(404,"Resume not found")
    db.query(Resume).filter(Resume.profile_id==row.profile_id).update({Resume.is_primary:False})
    row.is_primary=True; db.commit(); db.refresh(row); return serialize(row)

@router.get("/{resume_id}/download")
def download(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row=(db.query(Resume).join(CareerProfile).filter(Resume.id==resume_id,CareerProfile.user_id==user.id).first())
    if not row: raise HTTPException(404,"Resume not found")
    path=STORAGE_ROOT/row.stored_filename
    if not path.exists(): raise HTTPException(404,"Stored file is missing")
    return FileResponse(path,media_type=row.mime_type,filename=row.original_filename)

@router.delete("/{resume_id}", status_code=204)
def delete_resume(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row=(db.query(Resume).join(CareerProfile).filter(Resume.id==resume_id,CareerProfile.user_id==user.id).first())
    if not row: raise HTTPException(404,"Resume not found")
    was_primary=row.is_primary; profile_id=row.profile_id; path=STORAGE_ROOT/row.stored_filename
    db.delete(row); db.commit()
    if path.exists(): path.unlink()
    if was_primary:
        replacement=db.query(Resume).filter(Resume.profile_id==profile_id).order_by(Resume.created_at.desc()).first()
        if replacement: replacement.is_primary=True; db.commit()


@router.post("/{resume_id}/analyze")
def analyze(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row=(db.query(Resume).join(CareerProfile).filter(Resume.id==resume_id,CareerProfile.user_id==user.id).first())
    if not row: raise HTTPException(404,"Resume not found")
    profile=db.get(CareerProfile,row.profile_id)
    result=analyze_resume(row.extracted_text or "",profile.priority_keywords or [],profile.target_titles or [])
    row.analysis_score=result["score"]
    row.strengths=result["strengths"]
    row.gaps=result["gaps"]
    row.metrics_found=result["metrics_found"]
    row.analysis_summary=result["summary"]
    row.analyzed_at=datetime.utcnow()
    db.commit(); db.refresh(row)
    return serialize(row)
