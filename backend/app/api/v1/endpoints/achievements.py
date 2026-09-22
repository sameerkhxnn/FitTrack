from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.weight import WeightEntry
from backend.app.models.workout import WorkoutSession, PersonalRecord
from backend.app.models.measurement import MeasurementEntry
from backend.app.models.photo import ProgressPhoto
from backend.app.models.achievement import UserAchievement, Notification
from backend.app.schemas.achievement import AchievementOut, NotificationOut

router = APIRouter()

ACHIEVEMENT_DEFINITIONS = [
    {"key": "first_workout", "title": "First Step", "description": "Completed your first workout session.", "icon": "Flame"},
    {"key": "workout_10", "title": "Building Momentum", "description": "Logged 10 workout sessions.", "icon": "Dumbbell"},
    {"key": "workout_50", "title": "Iron Will", "description": "Completed 50 intense workout sessions.", "icon": "Trophy"},
    {"key": "workout_100", "title": "Century Club", "description": "Completed 100 workouts. Elite dedication!", "icon": "Crown"},
    {"key": "first_pr", "title": "Breaking Limits", "description": "Set your very first Personal Record.", "icon": "Zap"},
    {"key": "pr_5", "title": "Strength Unleashed", "description": "Set 5 or more Personal Records.", "icon": "Sparkles"},
    {"key": "first_photo", "title": "Visual Proof", "description": "Uploaded your first progress photo.", "icon": "Camera"},
    {"key": "first_measurement", "title": "Anatomy Check", "description": "Logged your complete body measurements.", "icon": "Ruler"},
]

def sync_achievements(user: User, db: Session):
    # Check conditions
    session_count = db.query(WorkoutSession).filter(WorkoutSession.user_id == user.id).count()
    pr_count = db.query(PersonalRecord).filter(PersonalRecord.user_id == user.id).count()
    photo_count = db.query(ProgressPhoto).filter(ProgressPhoto.user_id == user.id).count()
    measurement_count = db.query(MeasurementEntry).filter(MeasurementEntry.user_id == user.id).count()

    existing_keys = {
        a.badge_key for a in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }

    to_award = []
    if session_count >= 1:
        to_award.append("first_workout")
    if session_count >= 10:
        to_award.append("workout_10")
    if session_count >= 50:
        to_award.append("workout_50")
    if session_count >= 100:
        to_award.append("workout_100")
    if pr_count >= 1:
        to_award.append("first_pr")
    if pr_count >= 5:
        to_award.append("pr_5")
    if photo_count >= 1:
        to_award.append("first_photo")
    if measurement_count >= 1:
        to_award.append("first_measurement")

    for key in to_award:
        if key not in existing_keys:
            definition = next((d for d in ACHIEVEMENT_DEFINITIONS if d["key"] == key), None)
            if definition:
                badge = UserAchievement(
                    user_id=user.id,
                    badge_key=key,
                    title=definition["title"],
                    description=definition["description"],
                    icon=definition["icon"],
                    unlocked_at=datetime.now(timezone.utc)
                )
                db.add(badge)
                # Create notification
                notif = Notification(
                    user_id=user.id,
                    title=f"Achievement Unlocked: {definition['title']}!",
                    message=definition["description"],
                    notification_type="achievement"
                )
                db.add(notif)
    db.commit()

@router.get("", response_model=List[Dict[str, Any]])
def get_user_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sync_achievements(current_user, db)
    unlocked = {
        a.badge_key: a for a in db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id).all()
    }

    results = []
    for d in ACHIEVEMENT_DEFINITIONS:
        is_unlocked = d["key"] in unlocked
        record = unlocked.get(d["key"])
        results.append({
            "key": d["key"],
            "title": d["title"],
            "description": d["description"],
            "icon": d["icon"],
            "is_unlocked": is_unlocked,
            "unlocked_at": record.unlocked_at.isoformat() if record else None
        })
    return results

@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@router.get("/timeline")
def get_journey_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    timeline = []

    # Account created
    timeline.append({
        "type": "account_created",
        "date": current_user.created_at.date().isoformat(),
        "title": "Began Fitness Journey",
        "detail": f"Joined FitTrack as {current_user.name}",
        "icon": "Compass"
    })

    # First and milestone weights
    weights = db.query(WeightEntry).filter(
        WeightEntry.user_id == current_user.id
    ).order_by(WeightEntry.date.asc()).all()
    if weights:
        timeline.append({
            "type": "starting_weight",
            "date": weights[0].date.isoformat(),
            "title": f"Starting Weight Logged: {weights[0].weight} kg",
            "detail": "Baseline recorded.",
            "icon": "Scale"
        })
        if len(weights) > 1 and weights[-1].weight != weights[0].weight:
            delta = round(weights[-1].weight - weights[0].weight, 1)
            sign = "+" if delta > 0 else ""
            timeline.append({
                "type": "weight_update",
                "date": weights[-1].date.isoformat(),
                "title": f"Current Weight: {weights[-1].weight} kg ({sign}{delta} kg)",
                "detail": f"Tracking progression across {len(weights)} entries.",
                "icon": "TrendingUp" if delta < 0 else "TrendingDown"
            })

    # Personal Records
    prs = db.query(PersonalRecord).filter(
        PersonalRecord.user_id == current_user.id
    ).order_by(PersonalRecord.achieved_date.asc()).all()
    for pr in prs:
        timeline.append({
            "type": "personal_record",
            "date": pr.achieved_date.isoformat(),
            "title": f"New PR: {pr.exercise_name} ({pr.max_weight} kg × {pr.best_reps})",
            "detail": f"Estimated 1RM: {pr.estimated_1rm} kg",
            "icon": "Trophy"
        })

    # Workouts count milestones
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id
    ).order_by(WorkoutSession.date.asc()).all()
    if sessions:
        timeline.append({
            "type": "first_workout",
            "date": sessions[0].date.isoformat(),
            "title": f"First Workout: {sessions[0].name}",
            "detail": f"Lifted {sessions[0].total_volume} kg volume.",
            "icon": "Dumbbell"
        })
        if len(sessions) >= 10:
            timeline.append({
                "type": "workout_milestone_10",
                "date": sessions[9].date.isoformat(),
                "title": "10 Workout Sessions Milestone!",
                "detail": "Consistency is compounding.",
                "icon": "Award"
            })
        if len(sessions) >= 50:
            timeline.append({
                "type": "workout_milestone_50",
                "date": sessions[49].date.isoformat(),
                "title": "50 Workout Sessions Milestone!",
                "detail": "Halfway to the century club!",
                "icon": "Crown"
            })

    # Sort timeline by date descending
    timeline.sort(key=lambda x: x["date"], reverse=True)
    return timeline
