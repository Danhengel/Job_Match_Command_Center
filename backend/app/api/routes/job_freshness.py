from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.job_freshness import freshness_stats, verify_stale_jobs


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("/freshness")
def read_freshness(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return freshness_stats(db)


@router.post("/verify-stale")
def verify_stale(
    limit: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return verify_stale_jobs(db, limit=limit)
