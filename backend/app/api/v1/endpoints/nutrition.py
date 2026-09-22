from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.nutrition import NutritionLog
from backend.app.schemas.nutrition import (
    NutritionLogCreate, NutritionLogUpdate, NutritionLogOut,
    NutritionSummaryOut, NutritionWeeklyOut,
)
from backend.app.services.fitness_calc import (
    calculate_bmr, calculate_tdee, calculate_target_macros, calculate_age,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_targets(current_user: User, profile: Optional[Profile]):
    target_cals  = 2200.0
    target_prot  = 150.0
    target_carbs = 250.0
    target_fat   = 65.0
    if profile and profile.current_weight and current_user.height:
        age   = calculate_age(current_user.date_of_birth)
        bmr   = calculate_bmr(profile.current_weight, current_user.height, age, current_user.gender)
        tdee  = calculate_tdee(bmr, profile.activity_level or "moderate")
        macros = calculate_target_macros(tdee, profile.fitness_goal or "maintain", profile.current_weight)
        target_cals  = float(macros["target_calories"])
        target_prot  = float(macros["protein_g"])
        target_carbs = float(macros["carbs_g"])
        target_fat   = float(macros["fat_g"])
    return target_cals, target_prot, target_carbs, target_fat


# ---------------------------------------------------------------------------
# GET  /nutrition/summary  — daily summary
# ---------------------------------------------------------------------------

@router.get("/summary", response_model=NutritionSummaryOut)
def get_daily_nutrition_summary(
    log_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = log_date or date.today()
    logs = (
        db.query(NutritionLog)
        .filter(NutritionLog.user_id == current_user.id, NutritionLog.date == target_date)
        .order_by(NutritionLog.created_at.asc())
        .all()
    )

    total_cals  = sum(l.calories for l in logs)
    total_prot  = sum(l.protein  for l in logs)
    total_carbs = sum(l.carbs    for l in logs)
    total_fat   = sum(l.fat      for l in logs)

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    target_cals, target_prot, target_carbs, target_fat = _get_targets(current_user, profile)

    return NutritionSummaryOut(
        date=target_date,
        total_calories=round(total_cals, 1),
        total_protein=round(total_prot, 1),
        total_carbs=round(total_carbs, 1),
        total_fat=round(total_fat, 1),
        target_calories=round(target_cals, 1),
        target_protein=round(target_prot, 1),
        target_carbs=round(target_carbs, 1),
        target_fat=round(target_fat, 1),
        remaining_calories=round(max(0.0, target_cals - total_cals), 1),
        logs=logs,
    )


# ---------------------------------------------------------------------------
# GET  /nutrition/weekly  — 7-day rolling summary
# ---------------------------------------------------------------------------

@router.get("/weekly", response_model=NutritionWeeklyOut)
def get_weekly_nutrition_summary(
    end_date: Optional[date] = Query(default=None, description="Last day of 7-day window (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end   = end_date or date.today()
    start = end - timedelta(days=6)

    logs = (
        db.query(NutritionLog)
        .filter(
            NutritionLog.user_id == current_user.id,
            NutritionLog.date >= start,
            NutritionLog.date <= end,
        )
        .all()
    )

    # Aggregate by day
    by_day: dict = {}
    for l in logs:
        d = str(l.date)
        if d not in by_day:
            by_day[d] = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
        by_day[d]["calories"] += l.calories
        by_day[d]["protein"]  += l.protein
        by_day[d]["carbs"]    += l.carbs
        by_day[d]["fat"]      += l.fat

    days_logged = len(by_day)
    if days_logged == 0:
        return NutritionWeeklyOut(
            start_date=start, end_date=end,
            days_logged=0, avg_calories=0, avg_protein=0,
            avg_carbs=0, avg_fat=0, daily_breakdown=[],
        )

    avg_cals  = round(sum(v["calories"] for v in by_day.values()) / days_logged, 1)
    avg_prot  = round(sum(v["protein"]  for v in by_day.values()) / days_logged, 1)
    avg_carbs = round(sum(v["carbs"]    for v in by_day.values()) / days_logged, 1)
    avg_fat   = round(sum(v["fat"]      for v in by_day.values()) / days_logged, 1)

    breakdown = [
        {"date": d, **{k: round(v, 1) for k, v in vals.items()}}
        for d, vals in sorted(by_day.items())
    ]

    return NutritionWeeklyOut(
        start_date=start, end_date=end,
        days_logged=days_logged,
        avg_calories=avg_cals, avg_protein=avg_prot,
        avg_carbs=avg_carbs, avg_fat=avg_fat,
        daily_breakdown=breakdown,
    )


# ---------------------------------------------------------------------------
# GET  /nutrition  — paginated log history
# ---------------------------------------------------------------------------

@router.get("", response_model=List[NutritionLogOut])
def get_nutrition_logs(
    start_date: Optional[date] = Query(None),
    end_date:   Optional[date] = Query(None),
    meal_type:  Optional[str]  = Query(None),
    limit:      int            = Query(50, ge=1, le=200),
    offset:     int            = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id)
    if start_date:
        q = q.filter(NutritionLog.date >= start_date)
    if end_date:
        q = q.filter(NutritionLog.date <= end_date)
    if meal_type:
        q = q.filter(NutritionLog.meal_type == meal_type.lower())
    return q.order_by(NutritionLog.date.desc(), NutritionLog.created_at.desc()).offset(offset).limit(limit).all()


# ---------------------------------------------------------------------------
# POST /nutrition  — create log entry
# ---------------------------------------------------------------------------

@router.post("", response_model=NutritionLogOut, status_code=status.HTTP_201_CREATED)
def create_nutrition_log(
    log_in: NutritionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = NutritionLog(
        user_id=current_user.id,
        food_name=log_in.food_name.strip(),
        meal_type=log_in.meal_type.lower(),
        calories=log_in.calories,
        protein=log_in.protein,
        carbs=log_in.carbs,
        fat=log_in.fat,
        date=log_in.date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ---------------------------------------------------------------------------
# PUT  /nutrition/{log_id}  — edit log entry
# ---------------------------------------------------------------------------

@router.put("/{log_id}", response_model=NutritionLogOut)
def update_nutrition_log(
    log_id: int,
    log_in: NutritionLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(NutritionLog).filter(
        NutritionLog.id == log_id,
        NutritionLog.user_id == current_user.id,
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log entry not found.")

    for field, value in log_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return log


# ---------------------------------------------------------------------------
# DELETE /nutrition/{log_id}
# ---------------------------------------------------------------------------

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(NutritionLog).filter(
        NutritionLog.id == log_id,
        NutritionLog.user_id == current_user.id,
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log entry not found.")
    db.delete(log)
    db.commit()
    return None
