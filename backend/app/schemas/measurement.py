from typing import Optional, Dict
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class MeasurementCreate(BaseModel):
    date: date
    waist: Optional[float] = Field(None, ge=30, le=250)
    chest: Optional[float] = Field(None, ge=30, le=250)
    arms: Optional[float] = Field(None, ge=15, le=100)
    shoulders: Optional[float] = Field(None, ge=40, le=250)
    thighs: Optional[float] = Field(None, ge=20, le=150)
    hips: Optional[float] = Field(None, ge=40, le=250)
    neck: Optional[float] = Field(None, ge=15, le=100)
    notes: Optional[str] = None

class MeasurementUpdate(MeasurementCreate):
    date: Optional[date] = None

class MeasurementOut(BaseModel):
    id: int
    user_id: int
    date: date
    waist: Optional[float] = None
    chest: Optional[float] = None
    arms: Optional[float] = None
    shoulders: Optional[float] = None
    thighs: Optional[float] = None
    hips: Optional[float] = None
    neck: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MeasurementComparisonOut(BaseModel):
    first_date: date
    second_date: date
    diffs: Dict[str, Optional[float]]
