from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    height = Column(Float, nullable=True)  # stored in cm
    gender = Column(String(20), nullable=True)  # male, female, other, prefer_not_to_say
    is_admin = Column(Boolean, default=False, nullable=False, server_default="0")
    is_active = Column(Boolean, default=True, nullable=False, server_default="1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    weights = relationship("WeightEntry", back_populates="user", cascade="all, delete-orphan")
    measurements = relationship("MeasurementEntry", back_populates="user", cascade="all, delete-orphan")
    routines = relationship("WorkoutRoutine", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("WorkoutSession", back_populates="user", cascade="all, delete-orphan")
    prs = relationship("PersonalRecord", back_populates="user", cascade="all, delete-orphan")
    photos = relationship("ProgressPhoto", back_populates="user", cascade="all, delete-orphan")
    nutrition_logs = relationship("NutritionLog", back_populates="user", cascade="all, delete-orphan")
    water_logs = relationship("WaterLog", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("DailyHabit", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
