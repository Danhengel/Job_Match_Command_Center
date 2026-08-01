from pydantic import BaseModel, Field


class CompanyWatchRequest(BaseModel):
    company: str = Field(min_length=1, max_length=500)
    notes: str = ""


class CoachRequest(BaseModel):
    question: str = Field(min_length=3, max_length=3000)
    profile_id: int | None = None
    application_id: int | None = None
