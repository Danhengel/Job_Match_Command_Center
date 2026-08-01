from datetime import datetime
from pydantic import BaseModel, Field


class RecruiterCreate(BaseModel):
    company: str = Field(min_length=1, max_length=500)
    name: str = Field(min_length=1, max_length=255)
    title: str = ""
    email: str = ""
    phone: str = ""
    linkedin_url: str = ""
    status: str = "new"
    relationship_score: int = Field(default=0, ge=0, le=100)
    notes: str = ""
    last_contact_at: datetime | None = None
    next_follow_up_at: datetime | None = None


class RecruiterUpdate(BaseModel):
    company: str | None = None
    name: str | None = None
    title: str | None = None
    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    status: str | None = None
    relationship_score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None
    last_contact_at: datetime | None = None
    next_follow_up_at: datetime | None = None


class InterviewEventCreate(BaseModel):
    application_id: int
    event_type: str = "interview"
    title: str = Field(min_length=1, max_length=500)
    starts_at: datetime
    ends_at: datetime | None = None
    location: str = ""
    meeting_url: str = ""
    notes: str = ""
    reminder_minutes: int = Field(default=60, ge=0, le=10080)


class InterviewEventUpdate(BaseModel):
    event_type: str | None = None
    title: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    location: str | None = None
    meeting_url: str | None = None
    notes: str | None = None
    reminder_minutes: int | None = Field(default=None, ge=0, le=10080)
    completed: bool | None = None


class SalaryPlanRequest(BaseModel):
    target_base: int | None = Field(default=None, ge=0)
    minimum_base: int | None = Field(default=None, ge=0)
    target_bonus_pct: int | None = Field(default=None, ge=0, le=500)
