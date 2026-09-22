from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class RoutineExerciseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    exercise_order: int = 0
    target_sets: int = Field(3, ge=1, le=20)
    target_reps: int = Field(10, ge=1, le=100)
    target_weight: float = Field(0.0, ge=0)
    rest_time_seconds: int = Field(90, ge=0, le=600)
    notes: Optional[str] = None

class RoutineExerciseCreate(RoutineExerciseBase):
    pass

class RoutineExerciseOut(RoutineExerciseBase):
    id: int
    routine_id: int

    model_config = ConfigDict(from_attributes=True)

class RoutineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class RoutineCreate(RoutineBase):
    exercises: List[RoutineExerciseCreate] = []

class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    exercises: Optional[List[RoutineExerciseCreate]] = None

class RoutineOut(RoutineBase):
    id: int
    user_id: int
    created_at: datetime
    exercises: List[RoutineExerciseOut] = []

    model_config = ConfigDict(from_attributes=True)

class SessionExerciseSetBase(BaseModel):
    exercise_name: str
    set_number: int
    reps: int = Field(..., ge=0)
    weight: float = Field(..., ge=0)
    completed: bool = True
    is_pr: bool = False
    notes: Optional[str] = None

class SessionExerciseSetCreate(SessionExerciseSetBase):
    pass

class SessionExerciseSetOut(SessionExerciseSetBase):
    id: int
    session_id: int

    model_config = ConfigDict(from_attributes=True)

class SessionCreate(BaseModel):
    routine_id: Optional[int] = None
    name: str
    date: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: int = 0
    total_volume: float = 0.0
    estimated_calories: int = 0
    notes: Optional[str] = None
    sets: List[SessionExerciseSetCreate] = []

class SessionOut(BaseModel):
    id: int
    user_id: int
    routine_id: Optional[int] = None
    name: str
    date: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: int
    total_volume: float
    estimated_calories: int
    notes: Optional[str] = None
    created_at: datetime
    sets: List[SessionExerciseSetOut] = []

    model_config = ConfigDict(from_attributes=True)

class PersonalRecordOut(BaseModel):
    id: int
    user_id: int
    exercise_name: str
    max_weight: float
    best_reps: int
    estimated_1rm: float
    achieved_date: date

    model_config = ConfigDict(from_attributes=True)
