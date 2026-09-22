from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, Date, DateTime, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    weight = Column(Float, nullable=True)  # in kg
    pose = Column(String(50), default="front")  # front, side, back, custom
    image_url = Column(String(500), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="photos")
