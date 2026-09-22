from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AchievementOut(BaseModel):
    id: int
    badge_key: str
    title: str
    description: str
    icon: str
    unlocked_at: datetime
    is_unlocked: bool = True

    model_config = ConfigDict(from_attributes=True)

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
