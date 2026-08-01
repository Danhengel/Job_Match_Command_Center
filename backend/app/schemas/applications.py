from datetime import datetime
from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    profile_id: int
    job_id: int
    tailoring_id: int | None = None
    status: str = "wishlist"


class ApplicationUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    salary_target: int | None = Field(default=None, ge=0)
    notes: str | None = None
    next_action: str | None = None
    next_action_at: datetime | None = None
