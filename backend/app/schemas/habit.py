from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class WaterLogUpdate(BaseModel):
    amount_ml: int = Field(..., ge=0)
    goal_ml: Optional[int] = Field(2500, ge=500, le=10000)
    date: date

class WaterLogOut(BaseModel):
    id: int
    user_id: int
    date: date
    amount_ml: int
    goal_ml: int
    percentage: float

    model_config = ConfigDict(from_attributes=True)

class DailyHabitUpdate(BaseModel):
    date: date
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    steps: Optional[int] = Field(None, ge=0)
    stretched: Optional[bool] = None
    cardio_done: Optional[bool] = None
    workout_done: Optional[bool] = None
    notes: Optional[str] = None

class DailyHabitOut(BaseModel):
    id: int
    user_id: int
    date: date
    sleep_hours: float
    steps: int
    stretched: bool
    cardio_done: bool
    workout_done: bool
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
