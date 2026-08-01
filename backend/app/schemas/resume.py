from pydantic import BaseModel

class ResumeResponse(BaseModel):
    id: int
    profile_id: int
    name: str
    original_filename: str
    mime_type: str
    file_size: int
    is_primary: bool
    extracted_text_preview: str = ""
    model_config = {"from_attributes": True}
