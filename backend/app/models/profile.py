from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_weight = Column(Float, nullable=True)  # in kg
    goal_weight = Column(Float, nullable=True)     # in kg
    fitness_goal = Column(String(50), default="maintain")  # lose_fat, maintain, build_muscle, recomposition
    activity_level = Column(String(50), default="moderate")  # sedentary, light, moderate, active, very_active
    training_days_per_week = Column(Integer, default=4)
    unit_system = Column(String(20), default="metric")  # metric, imperial

    user = relationship("User", back_populates="profile")
