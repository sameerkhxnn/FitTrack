"""
Admin API — protected by get_current_admin_user dependency.

Endpoints:
  GET    /admin/stats                        – Platform-wide aggregate statistics
  GET    /admin/users                        – Paginated user list (search, filter)
  GET    /admin/users/{user_id}              – Full user detail + all their data counts
  PUT    /admin/users/{user_id}              – Update name/email/is_admin/is_active
  DELETE /admin/users/{user_id}             – Hard-delete user + all cascade data
  POST   /admin/users/{user_id}/reset-password  – Force-set a new password for any user
  GET    /admin/users/{user_id}/activity    – User's recent workouts, weights, nutrition
  GET    /admin/growth                       – User registration counts over time
  GET    /admin/activity                     – Platform-wide daily activity metrics
  POST   /admin/broadcast                    – Send a notification to all or one user
  GET    /admin/me                           – Confirm current admin identity
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_admin_user
from backend.app.core.security import get_password_hash
from backend.app.models.achievement import Notification
from backend.app.models.habit import DailyHabit, WaterLog
from backend.app.models.measurement import MeasurementEntry
from backend.app.models.nutrition import NutritionLog
from backend.app.models.photo import ProgressPhoto
from backend.app.models.profile import Profile
from backend.app.models.user import User
from backend.app.models.weight import WeightEntry
from backend.app.models.workout import PersonalRecord, WorkoutSession, WorkoutRoutine
from backend.app.schemas.user import AdminUserOut, AdminUserUpdate, AdminStatsOut

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


# ---------------------------------------------------------------------------
# 1. Admin identity check
# ---------------------------------------------------------------------------

@router.get("/me", tags=["admin"])
def admin_me(admin: User = Depends(get_current_admin_user)):
    return {
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "is_admin": admin.is_admin,
    }


# ---------------------------------------------------------------------------
# 2. Platform statistics
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=AdminStatsOut, tags=["admin"])
def get_platform_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    week_start = today_start - timedelta(days=7)

    total_users      = db.query(func.count(User.id)).scalar() or 0
    active_users     = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    admin_users      = db.query(func.count(User.id)).filter(User.is_admin == True).scalar() or 0
    new_today        = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    new_this_week    = db.query(func.count(User.id)).filter(User.created_at >= week_start).scalar() or 0
    total_workouts   = db.query(func.count(WorkoutSession.id)).scalar() or 0
    total_weights    = db.query(func.count(WeightEntry.id)).scalar() or 0
    total_nutrition  = db.query(func.count(NutritionLog.id)).scalar() or 0
    total_photos     = db.query(func.count(ProgressPhoto.id)).scalar() or 0
    total_prs        = db.query(func.count(PersonalRecord.id)).scalar() or 0
    total_measures   = db.query(func.count(MeasurementEntry.id)).scalar() or 0

    return AdminStatsOut(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        new_users_today=new_today,
        new_users_this_week=new_this_week,
        total_workouts=total_workouts,
        total_weight_entries=total_weights,
        total_nutrition_logs=total_nutrition,
        total_photos=total_photos,
        total_prs=total_prs,
        total_measurements=total_measures,
    )


# ---------------------------------------------------------------------------
# 3. User list (paginated, searchable)
# ---------------------------------------------------------------------------

@router.get("/users", tags=["admin"])
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search name or email"),
    is_admin: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("created_at", description="created_at | name | email"),
    sort_dir: str = Query("desc", description="asc | desc"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    q = db.query(User)

    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            (func.lower(User.name).like(like)) | (func.lower(User.email).like(like))
        )
    if is_admin is not None:
        q = q.filter(User.is_admin == is_admin)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)

    # Sorting
    col_map = {"created_at": User.created_at, "name": User.name, "email": User.email}
    sort_col = col_map.get(sort_by, User.created_at)
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    total = q.count()
    users = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, -(-total // per_page)),  # ceil division
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "is_admin": u.is_admin,
                "is_active": u.is_active,
                "gender": u.gender,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
    }


# ---------------------------------------------------------------------------
# 4. User detail
# ---------------------------------------------------------------------------

@router.get("/users/{user_id}", tags=["admin"])
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    user = _get_user_or_404(user_id, db)
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    # Data counts
    workout_count    = db.query(func.count(WorkoutSession.id)).filter(WorkoutSession.user_id == user_id).scalar() or 0
    routine_count    = db.query(func.count(WorkoutRoutine.id)).filter(WorkoutRoutine.user_id == user_id).scalar() or 0
    weight_count     = db.query(func.count(WeightEntry.id)).filter(WeightEntry.user_id == user_id).scalar() or 0
    nutrition_count  = db.query(func.count(NutritionLog.id)).filter(NutritionLog.user_id == user_id).scalar() or 0
    photo_count      = db.query(func.count(ProgressPhoto.id)).filter(ProgressPhoto.user_id == user_id).scalar() or 0
    pr_count         = db.query(func.count(PersonalRecord.id)).filter(PersonalRecord.user_id == user_id).scalar() or 0
    measure_count    = db.query(func.count(MeasurementEntry.id)).filter(MeasurementEntry.user_id == user_id).scalar() or 0

    # Latest weight entry
    latest_weight = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == user_id)
        .order_by(WeightEntry.date.desc())
        .first()
    )

    # Most recent 3 workout sessions
    recent_sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == user_id)
        .order_by(WorkoutSession.date.desc())
        .limit(3)
        .all()
    )

    # Top 3 PRs
    top_prs = (
        db.query(PersonalRecord)
        .filter(PersonalRecord.user_id == user_id)
        .order_by(PersonalRecord.estimated_1rm.desc())
        .limit(3)
        .all()
    )

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "gender": user.gender,
            "height": user.height,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "created_at": user.created_at.isoformat(),
        },
        "profile": {
            "current_weight": profile.current_weight if profile else None,
            "goal_weight": profile.goal_weight if profile else None,
            "fitness_goal": profile.fitness_goal if profile else None,
            "activity_level": profile.activity_level if profile else None,
            "training_days_per_week": profile.training_days_per_week if profile else None,
            "unit_system": profile.unit_system if profile else "metric",
        } if profile else None,
        "stats": {
            "workouts": workout_count,
            "routines": routine_count,
            "weight_entries": weight_count,
            "nutrition_logs": nutrition_count,
            "photos": photo_count,
            "personal_records": pr_count,
            "measurements": measure_count,
        },
        "latest_weight": {
            "weight": latest_weight.weight,
            "date": latest_weight.date.isoformat(),
        } if latest_weight else None,
        "recent_sessions": [
            {
                "id": s.id,
                "name": s.name,
                "date": s.date.isoformat(),
                "duration_minutes": round(s.duration_seconds / 60, 1),
                "total_volume": s.total_volume,
            }
            for s in recent_sessions
        ],
        "top_prs": [
            {
                "exercise_name": p.exercise_name,
                "max_weight": p.max_weight,
                "best_reps": p.best_reps,
                "estimated_1rm": p.estimated_1rm,
            }
            for p in top_prs
        ],
    }


# ---------------------------------------------------------------------------
# 5. Update user
# ---------------------------------------------------------------------------

@router.put("/users/{user_id}", response_model=AdminUserOut, tags=["admin"])
def update_user(
    user_id: int,
    user_in: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    user = _get_user_or_404(user_id, db)

    # Prevent self-demotion
    if user.id == admin.id and user_in.is_admin is False:
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own admin privileges.",
        )

    update_data = user_in.model_dump(exclude_unset=True)

    # If email is changing, check uniqueness
    if "email" in update_data and update_data["email"]:
        new_email = update_data["email"].lower()
        conflict = db.query(User).filter(
            User.email == new_email, User.id != user_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use.")
        update_data["email"] = new_email

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# 6. Delete user (hard delete — cascade handles related data)
# ---------------------------------------------------------------------------

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["admin"])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    user = _get_user_or_404(user_id, db)

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    db.delete(user)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# 7. Force-reset a user's password
# ---------------------------------------------------------------------------

@router.post("/users/{user_id}/reset-password", tags=["admin"])
def admin_reset_password(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """
    Body: { "new_password": "NewSecure123!" }
    """
    new_password = payload.get("new_password", "")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = _get_user_or_404(user_id, db)
    user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"status": "success", "message": f"Password reset for user {user.email}."}


# ---------------------------------------------------------------------------
# 8. User activity feed (recent data across all modules)
# ---------------------------------------------------------------------------

@router.get("/users/{user_id}/activity", tags=["admin"])
def get_user_activity(
    user_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    _get_user_or_404(user_id, db)
    since = date.today() - timedelta(days=days)

    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == user_id, WorkoutSession.date >= since)
        .order_by(WorkoutSession.date.desc())
        .limit(20)
        .all()
    )
    weights = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == user_id, WeightEntry.date >= since)
        .order_by(WeightEntry.date.desc())
        .limit(30)
        .all()
    )
    nutrition_days = (
        db.query(NutritionLog.date, func.sum(NutritionLog.calories).label("total_cals"))
        .filter(NutritionLog.user_id == user_id, NutritionLog.date >= since)
        .group_by(NutritionLog.date)
        .order_by(NutritionLog.date.desc())
        .limit(30)
        .all()
    )

    return {
        "user_id": user_id,
        "days": days,
        "workouts": [
            {
                "id": s.id,
                "name": s.name,
                "date": s.date.isoformat(),
                "duration_minutes": round(s.duration_seconds / 60, 1),
                "total_volume": s.total_volume,
                "calories": s.estimated_calories,
            }
            for s in sessions
        ],
        "weights": [
            {"date": w.date.isoformat(), "weight": w.weight}
            for w in weights
        ],
        "nutrition": [
            {"date": str(n.date), "total_calories": round(n.total_cals, 1)}
            for n in nutrition_days
        ],
    }


# ---------------------------------------------------------------------------
# 9. Platform growth over time
# ---------------------------------------------------------------------------

@router.get("/growth", tags=["admin"])
def get_platform_growth(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Returns daily user registration counts for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    rows = (
        db.query(
            func.date(User.created_at).label("day"),
            func.count(User.id).label("count"),
        )
        .filter(User.created_at >= since)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at).asc())
        .all()
    )

    # Cumulative total
    total_before = (
        db.query(func.count(User.id))
        .filter(User.created_at < since)
        .scalar() or 0
    )
    cumulative = total_before
    result = []
    for row in rows:
        cumulative += row.count
        result.append(
            {"date": str(row.day), "new_users": row.count, "cumulative": cumulative}
        )

    return {"days": days, "data": result}


# ---------------------------------------------------------------------------
# 10. Platform daily activity
# ---------------------------------------------------------------------------

@router.get("/activity", tags=["admin"])
def get_platform_activity(
    days: int = Query(14, ge=1, le=90),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Daily workout sessions and nutrition logs across all users."""
    since = date.today() - timedelta(days=days)

    sessions_per_day = (
        db.query(
            WorkoutSession.date.label("day"),
            func.count(WorkoutSession.id).label("sessions"),
        )
        .filter(WorkoutSession.date >= since)
        .group_by(WorkoutSession.date)
        .all()
    )
    nutrition_per_day = (
        db.query(
            NutritionLog.date.label("day"),
            func.count(NutritionLog.id).label("logs"),
        )
        .filter(NutritionLog.date >= since)
        .group_by(NutritionLog.date)
        .all()
    )

    sessions_map = {str(r.day): r.sessions for r in sessions_per_day}
    nutrition_map = {str(r.day): r.logs for r in nutrition_per_day}

    all_days = sorted(
        set(sessions_map.keys()) | set(nutrition_map.keys())
    )

    return {
        "days": days,
        "data": [
            {
                "date": d,
                "workout_sessions": sessions_map.get(d, 0),
                "nutrition_logs": nutrition_map.get(d, 0),
            }
            for d in all_days
        ],
    }


# ---------------------------------------------------------------------------
# 11. Broadcast notification
# ---------------------------------------------------------------------------

@router.post("/broadcast", tags=["admin"])
def broadcast_notification(
    payload: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """
    Body:
      {
        "title": "System Update",
        "message": "New features have been deployed.",
        "user_id": null        // null = send to ALL active users
      }
    """
    title   = payload.get("title", "").strip()
    message = payload.get("message", "").strip()
    user_id = payload.get("user_id")  # optional — int or null

    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required.")

    if user_id:
        target_users = db.query(User).filter(
            User.id == int(user_id), User.is_active == True
        ).all()
    else:
        target_users = db.query(User).filter(User.is_active == True).all()

    if not target_users:
        raise HTTPException(status_code=404, detail="No active users found for the given criteria.")

    notifs = [
        Notification(
            user_id=u.id,
            title=title,
            message=message,
            notification_type="admin_broadcast",
            is_read=False,
        )
        for u in target_users
    ]
    db.add_all(notifs)
    db.commit()

    return {
        "status": "sent",
        "recipients": len(notifs),
        "title": title,
    }
