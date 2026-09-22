from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    date_of_birth: Optional[date] = None
    height: Optional[float] = Field(None, ge=50, le=280, description="Height in cm")
    gender: Optional[str] = Field(None, max_length=20)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    height: Optional[float] = Field(None, ge=50, le=280)
    gender: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)

class UserOut(UserBase):
    id: int
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Admin-specific schemas
class AdminUserOut(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    is_active: bool
    gender: Optional[str] = None
    height: Optional[float] = None
    date_of_birth: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    height: Optional[float] = None
    gender: Optional[str] = None

class AdminStatsOut(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    new_users_today: int
    new_users_this_week: int
    total_workouts: int
    total_weight_entries: int
    total_nutrition_logs: int
    total_photos: int
    total_prs: int
    total_measurements: int
