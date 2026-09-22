from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class ProgressPhotoOut(BaseModel):
    id: int
    user_id: int
    date: date
    weight: Optional[float] = None
    pose: str
    image_url: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProgressPhotoUpdate(BaseModel):
    date: Optional[date] = None
    weight: Optional[float] = Field(None, ge=0)
    pose: Optional[str] = None
    notes: Optional[str] = None

class ProgressPhotoComparisonOut(BaseModel):
    before_photo: ProgressPhotoOut
    after_photo: ProgressPhotoOut
    weight_diff: Optional[float] = None
    days_apart: int
