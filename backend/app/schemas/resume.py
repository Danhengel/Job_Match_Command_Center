from datetime import datetime

from pydantic import BaseModel, Field


class ResumeResponse(BaseModel):
    id: int
    profile_id: int
    name: str
    original_filename: str
    mime_type: str
    file_size: int
    is_primary: bool
    extracted_text_preview: str = ""
    content: str = ""
    analysis_score: int | None = None
    strengths: list = []
    gaps: list = []
    metrics_found: list = []
    analysis_summary: str = ""
    analyzed_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class BlankResumeCreate(BaseModel):
    profile_id: int
    name: str = Field(
        default="New Executive Resume",
        min_length=1,
        max_length=255,
    )
    content: str = ""
    make_primary: bool = False


class ResumeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )
    content: str | None = None
    change_note: str = Field(
        default="Manual save",
        max_length=500,
    )


class ResumeDuplicateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        max_length=255,
    )


class ResumeVersionResponse(BaseModel):
    id: int
    resume_id: int
    version_number: int
    name: str
    resume_text: str
    analysis_score: int | None = None
    change_note: str
    created_at: datetime

    model_config = {"from_attributes": True}
