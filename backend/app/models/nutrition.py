from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, Date, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    food_name = Column(String(150), nullable=False)
    meal_type = Column(String(50), default="lunch")  # breakfast, lunch, dinner, snack
    calories = Column(Float, nullable=False, default=0.0)
    protein = Column(Float, default=0.0)  # in grams
    carbs = Column(Float, default=0.0)    # in grams
    fat = Column(Float, default=0.0)      # in grams
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="nutrition_logs")
