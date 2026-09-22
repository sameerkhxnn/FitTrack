from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class WorkoutRoutine(Base):
    __tablename__ = "workout_routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Push Day", "Pull Day", "Leg Day"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="routines")
    exercises = relationship("RoutineExercise", back_populates="routine", cascade="all, delete-orphan", order_by="RoutineExercise.exercise_order")
    sessions = relationship("WorkoutSession", back_populates="routine")

class RoutineExercise(Base):
    __tablename__ = "routine_exercises"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("workout_routines.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Bench Press", "Squat"
    exercise_order = Column(Integer, default=0)
    target_sets = Column(Integer, default=3)
    target_reps = Column(Integer, default=10)
    target_weight = Column(Float, default=0.0)  # in kg
    rest_time_seconds = Column(Integer, default=90)
    notes = Column(Text, nullable=True)

    routine = relationship("WorkoutRoutine", back_populates="exercises")

class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    routine_id = Column(Integer, ForeignKey("workout_routines.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    date = Column(Date, default=date.today, nullable=False, index=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    total_volume = Column(Float, default=0.0)  # in kg (sets * reps * weight)
    estimated_calories = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")
    routine = relationship("WorkoutRoutine", back_populates="sessions")
    sets = relationship("SessionExerciseSet", back_populates="session", cascade="all, delete-orphan")

class SessionExerciseSet(Base):
    __tablename__ = "session_exercise_sets"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_name = Column(String(100), nullable=False, index=True)
    set_number = Column(Integer, default=1)
    reps = Column(Integer, default=0)
    weight = Column(Float, default=0.0)  # in kg
    completed = Column(Boolean, default=True)
    is_pr = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    session = relationship("WorkoutSession", back_populates="sets")

class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_name = Column(String(100), nullable=False, index=True)
    max_weight = Column(Float, default=0.0)  # in kg
    best_reps = Column(Integer, default=0)
    estimated_1rm = Column(Float, default=0.0)  # calculated via Epley formula
    achieved_date = Column(Date, default=date.today, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="prs")
