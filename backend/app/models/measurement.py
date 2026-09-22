from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class MeasurementEntry(Base):
    __tablename__ = "measurement_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    waist = Column(Float, nullable=True)      # in cm
    chest = Column(Float, nullable=True)      # in cm
    arms = Column(Float, nullable=True)       # in cm
    shoulders = Column(Float, nullable=True)  # in cm
    thighs = Column(Float, nullable=True)     # in cm
    hips = Column(Float, nullable=True)       # in cm
    neck = Column(Float, nullable=True)       # in cm
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="measurements")
