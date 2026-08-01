from pydantic import BaseModel, Field


class SavedSearchCreate(BaseModel):
    profile_id: int
    name: str = Field(min_length=2, max_length=255)
    titles: list[str] = Field(min_length=1)
    location: str = "Remote"
    minimum_score: int = Field(default=35, ge=0, le=100)
    use_catalog: bool = True
    use_remotive: bool = False
    use_jsearch: bool = True
    cadence: str = "daily"


class SavedSearchUpdate(BaseModel):
    name: str | None = None
    titles: list[str] | None = None
    location: str | None = None
    minimum_score: int | None = Field(default=None, ge=0, le=100)
    use_catalog: bool | None = None
    use_remotive: bool | None = None
    use_jsearch: bool | None = None
    active: bool | None = None
    cadence: str | None = None
