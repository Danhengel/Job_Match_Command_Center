from pydantic import BaseModel, Field


class TailoringRequest(BaseModel):
    profile_id: int
    job_id: int
    resume_id: int | None = None
    version_name: str | None = Field(default=None, max_length=255)


class CoverLetterRequest(BaseModel):
    tone: str = Field(default="executive", max_length=50)
