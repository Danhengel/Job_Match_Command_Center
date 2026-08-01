from pydantic import BaseModel, Field

class ProfileCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    home_location: str = Field(default="", max_length=255)
    remote_preferred: bool = True
    hybrid_preferred: bool = True
    radius_miles: int = Field(default=50, ge=0, le=500)
    salary_min: int | None = Field(default=None, ge=0)
    salary_target: int | None = Field(default=None, ge=0)
    target_titles: list[str] = []
    priority_keywords: list[str] = []
    exclusion_keywords: list[str] = []

class ProfileResponse(ProfileCreate):
    id: int
    user_id: int
    resume_count: int = 0
    primary_resume_id: int | None = None
    model_config = {"from_attributes": True}
