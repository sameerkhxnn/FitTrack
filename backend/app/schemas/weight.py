from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class WeightEntryCreate(BaseModel):
    weight: float = Field(..., ge=20, le=400, description="Weight in kg")
    date: date
    notes: Optional[str] = None

class WeightEntryUpdate(BaseModel):
    weight: Optional[float] = Field(None, ge=20, le=400)
    date: Optional[date] = None
    notes: Optional[str] = None

class WeightEntryOut(BaseModel):
    id: int
    user_id: int
    weight: float
    date: date
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WeightStatsOut(BaseModel):
    current_weight: Optional[float] = None
    starting_weight: Optional[float] = None
    goal_weight: Optional[float] = None
    total_change: Optional[float] = None
    average_weekly_change: Optional[float] = None
    entries_count: int = 0
