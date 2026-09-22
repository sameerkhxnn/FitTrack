from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class NutritionLogBase(BaseModel):
    food_name: str = Field(..., min_length=1, max_length=150)
    meal_type: str = "lunch"  # breakfast, lunch, dinner, snack
    calories: float = Field(..., ge=0)
    protein: float = Field(0.0, ge=0)
    carbs: float = Field(0.0, ge=0)
    fat: float = Field(0.0, ge=0)
    date: date

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLogUpdate(BaseModel):
    food_name: Optional[str] = Field(None, min_length=1, max_length=150)
    meal_type: Optional[str] = None
    calories: Optional[float] = Field(None, ge=0)
    protein: Optional[float] = Field(None, ge=0)
    carbs: Optional[float] = Field(None, ge=0)
    fat: Optional[float] = Field(None, ge=0)
    date: Optional[date] = None

class NutritionLogOut(NutritionLogBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NutritionSummaryOut(BaseModel):
    date: date
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    target_calories: Optional[float] = None
    target_protein: Optional[float] = None
    target_carbs: Optional[float] = None
    target_fat: Optional[float] = None
    remaining_calories: Optional[float] = None
    logs: List[NutritionLogOut] = []

class NutritionWeeklyOut(BaseModel):
    start_date: date
    end_date: date
    days_logged: int
    avg_calories: float
    avg_protein: float
    avg_carbs: float
    avg_fat: float
    daily_breakdown: List[dict] = []
