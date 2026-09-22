from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, Date, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    amount_ml = Column(Integer, default=0)
    goal_ml = Column(Integer, default=2500)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="water_logs")

class DailyHabit(Base):
    __tablename__ = "daily_habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    sleep_hours = Column(Float, default=7.0)
    steps = Column(Integer, default=0)
    stretched = Column(Boolean, default=False)
    cardio_done = Column(Boolean, default=False)
    workout_done = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="habits")
