from pydantic import BaseModel, Field
class CareerPageWatchCreate(BaseModel):
    company:str=Field(min_length=1,max_length=500)
    career_url:str=Field(min_length=5,max_length=1000)
    ats_type:str="unknown"
    board_identifier:str=""
    notes:str=""
class CareerPageWatchUpdate(BaseModel):
    company:str|None=None
    career_url:str|None=None
    ats_type:str|None=None
    board_identifier:str|None=None
    active:bool|None=None
    notes:str|None=None
