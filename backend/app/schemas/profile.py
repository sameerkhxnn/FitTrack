from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ProfileBase(BaseModel):
    current_weight: Optional[float] = Field(None, ge=20, le=400, description="Weight in kg")
    goal_weight: Optional[float] = Field(None, ge=20, le=400, description="Weight in kg")
    fitness_goal: Optional[str] = "maintain"  # lose_fat, maintain, build_muscle, recomposition
    activity_level: Optional[str] = "moderate"  # sedentary, light, moderate, active, very_active
    training_days_per_week: Optional[int] = Field(4, ge=1, le=7)
    unit_system: Optional[str] = "metric"  # metric, imperial

class ProfileUpdate(ProfileBase):
    pass

class ProfileCalculated(BaseModel):
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    bmr: Optional[int] = None
    tdee: Optional[int] = None
    target_calories: Optional[int] = None
    protein_min_g: Optional[int] = None
    protein_max_g: Optional[int] = None
    carbs_g: Optional[int] = None
    fat_g: Optional[int] = None

class ProfileOut(ProfileBase):
    id: int
    user_id: int
    calculated: Optional[ProfileCalculated] = None

    model_config = ConfigDict(from_attributes=True)
