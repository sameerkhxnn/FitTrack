from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.weight import WeightEntry
from backend.app.schemas.profile import ProfileOut, ProfileUpdate, ProfileCalculated
from backend.app.services.fitness_calc import (
    calculate_bmi, calculate_bmr, calculate_tdee, calculate_target_macros, calculate_age
)

router = APIRouter()

def get_or_create_profile(user: User, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(
            user_id=user.id,
            current_weight=None,
            goal_weight=None,
            fitness_goal="maintain",
            activity_level="moderate",
            training_days_per_week=4,
            unit_system="metric"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def compute_profile_metrics(user: User, profile: Profile, db: Session) -> ProfileCalculated:
    # If profile.current_weight is not set, attempt to get most recent weight entry
    current_weight = profile.current_weight
    if not current_weight:
        latest_weight_entry = db.query(WeightEntry).filter(
            WeightEntry.user_id == user.id
        ).order_by(WeightEntry.date.desc(), WeightEntry.created_at.desc()).first()
        if latest_weight_entry:
            current_weight = latest_weight_entry.weight

    age = calculate_age(user.date_of_birth)
    height_cm = user.height or 175.0
    weight_kg = current_weight or 70.0
    
    bmi, bmi_category = calculate_bmi(weight_kg, height_cm)
    bmr = calculate_bmr(weight_kg, height_cm, age, user.gender)
    tdee = calculate_tdee(bmr, profile.activity_level or "moderate")
    macros = calculate_target_macros(tdee, profile.fitness_goal or "maintain", weight_kg)
    
    return ProfileCalculated(
        bmi=bmi if current_weight and user.height else None,
        bmi_category=bmi_category if current_weight and user.height else None,
        bmr=bmr if current_weight and user.height else None,
        tdee=tdee if current_weight and user.height else None,
        target_calories=macros["target_calories"] if current_weight and user.height else None,
        protein_min_g=macros["protein_min_g"] if current_weight else None,
        protein_max_g=macros["protein_max_g"] if current_weight else None,
        carbs_g=macros["carbs_g"] if current_weight and user.height else None,
        fat_g=macros["fat_g"] if current_weight and user.height else None
    )

@router.get("", response_model=ProfileOut)
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = get_or_create_profile(current_user, db)
    calculated = compute_profile_metrics(current_user, profile, db)
    
    profile_dict = {
        "id": profile.id,
        "user_id": profile.user_id,
        "current_weight": profile.current_weight,
        "goal_weight": profile.goal_weight,
        "fitness_goal": profile.fitness_goal,
        "activity_level": profile.activity_level,
        "training_days_per_week": profile.training_days_per_week,
        "unit_system": profile.unit_system,
        "calculated": calculated
    }
    return profile_dict

@router.put("", response_model=ProfileOut)
def update_user_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = get_or_create_profile(current_user, db)
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
        
    db.commit()
    db.refresh(profile)
    
    # If current_weight was updated, also add/update today's weight entry
    if profile_in.current_weight is not None:
        from datetime import date
        today = date.today()
        existing_today = db.query(WeightEntry).filter(
            WeightEntry.user_id == current_user.id,
            WeightEntry.date == today
        ).first()
        if existing_today:
            existing_today.weight = profile_in.current_weight
        else:
            new_entry = WeightEntry(
                user_id=current_user.id,
                weight=profile_in.current_weight,
                date=today,
                notes="Updated via profile"
            )
            db.add(new_entry)
        db.commit()

    calculated = compute_profile_metrics(current_user, profile, db)
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "current_weight": profile.current_weight,
        "goal_weight": profile.goal_weight,
        "fitness_goal": profile.fitness_goal,
        "activity_level": profile.activity_level,
        "training_days_per_week": profile.training_days_per_week,
        "unit_system": profile.unit_system,
        "calculated": calculated
    }
