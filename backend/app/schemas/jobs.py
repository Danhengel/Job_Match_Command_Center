from pydantic import BaseModel, Field

class JobSearchRequest(BaseModel):
    profile_id: int
    titles: list[str] = Field(min_length=1)
    use_remotive: bool = True
    use_catalog: bool = True
    use_jsearch: bool = False
    jsearch_location: str = "United States"
    greenhouse_boards: list[str] = []
    lever_boards: list[str] = []
    ashby_boards: list[str] = []
    minimum_score: int = Field(default=20, ge=0, le=100)
