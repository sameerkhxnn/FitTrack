from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.weight import WeightEntry
from backend.app.models.measurement import MeasurementEntry
from backend.app.models.workout import WorkoutRoutine, WorkoutSession, PersonalRecord
from backend.app.models.nutrition import NutritionLog
from backend.app.models.habit import WaterLog, DailyHabit
from backend.app.schemas.user import UserUpdate, UserPasswordUpdate

router = APIRouter()

@router.put("/profile")
def update_account_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_in.email and user_in.email.lower() != current_user.email:
        existing = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another account.")
        current_user.email = user_in.email.lower()

    if user_in.name:
        current_user.name = user_in.name
    if user_in.date_of_birth is not None:
        current_user.date_of_birth = user_in.date_of_birth
    if user_in.height is not None:
        current_user.height = user_in.height
    if user_in.gender is not None:
        current_user.gender = user_in.gender

    db.commit()
    db.refresh(current_user)
    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "height": current_user.height,
            "gender": current_user.gender,
            "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None
        }
    }

@router.post("/change-password")
def change_password(
    pwd_in: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(pwd_in.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    current_user.password_hash = get_password_hash(pwd_in.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}

@router.get("/export-data")
def export_user_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Collect all user data for full GDPR-compliant data export
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    weights = db.query(WeightEntry).filter(WeightEntry.user_id == current_user.id).all()
    measurements = db.query(MeasurementEntry).filter(MeasurementEntry.user_id == current_user.id).all()
    routines = db.query(WorkoutRoutine).filter(WorkoutRoutine.user_id == current_user.id).all()
    sessions = db.query(WorkoutSession).filter(WorkoutSession.user_id == current_user.id).all()
    prs = db.query(PersonalRecord).filter(PersonalRecord.user_id == current_user.id).all()
    nutrition = db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id).all()
    habits = db.query(DailyHabit).filter(DailyHabit.user_id == current_user.id).all()
    water = db.query(WaterLog).filter(WaterLog.user_id == current_user.id).all()

    return {
        "exported_at": current_user.created_at.isoformat(),
        "account": {
            "name": current_user.name,
            "email": current_user.email,
            "height": current_user.height,
            "gender": current_user.gender,
            "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None
        },
        "profile": {
            "fitness_goal": profile.fitness_goal if profile else None,
            "goal_weight": profile.goal_weight if profile else None,
            "unit_system": profile.unit_system if profile else "metric"
        },
        "weight_history": [
            {"date": w.date.isoformat(), "weight_kg": w.weight, "notes": w.notes} for w in weights
        ],
        "measurements": [
            {
                "date": m.date.isoformat(),
                "waist": m.waist, "chest": m.chest, "arms": m.arms,
                "shoulders": m.shoulders, "thighs": m.thighs, "hips": m.hips, "neck": m.neck
            } for m in measurements
        ],
        "workouts": [
            {"date": s.date.isoformat(), "name": s.name, "duration_seconds": s.duration_seconds, "volume_kg": s.total_volume}
            for s in sessions
        ],
        "personal_records": [
            {"exercise": p.exercise_name, "max_weight": p.max_weight, "reps": p.best_reps, "estimated_1rm": p.estimated_1rm}
            for p in prs
        ],
        "nutrition": [
            {"date": n.date.isoformat(), "food": n.food_name, "calories": n.calories, "protein": n.protein, "carbs": n.carbs, "fat": n.fat}
            for n in nutrition
        ]
    }

@router.delete("/account", status_code=status.HTTP_200_OK)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"status": "success", "message": "Account and all associated personal data permanently removed."}
