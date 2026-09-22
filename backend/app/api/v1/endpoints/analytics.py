from typing import List, Optional, Dict, Any
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.weight import WeightEntry
from backend.app.models.workout import WorkoutSession, PersonalRecord
from backend.app.models.measurement import MeasurementEntry
from backend.app.models.nutrition import NutritionLog

router = APIRouter()

@router.get("/dashboard")
def get_analytics_dashboard(
    timeframe: str = Query("30d", description="Timeframe: 7d, 30d, 90d, 180d, 365d, all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    days_map = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "180d": 180,
        "365d": 365
    }
    num_days = days_map.get(timeframe)
    since_date = (date.today() - timedelta(days=num_days)) if num_days else date(2000, 1, 1)

    # 1. Weights
    weight_query = db.query(WeightEntry).filter(
        WeightEntry.user_id == current_user.id,
        WeightEntry.date >= since_date
    ).order_by(WeightEntry.date.asc()).all()

    weight_data = [
        {"date": w.date.isoformat(), "weight": w.weight, "notes": w.notes}
        for w in weight_query
    ]

    # 2. Workout Sessions & Volume
    sessions_query = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.date >= since_date
    ).order_by(WorkoutSession.date.asc()).all()

    workout_data = [
        {
            "id": s.id,
            "date": s.date.isoformat(),
            "name": s.name,
            "duration_minutes": round(s.duration_seconds / 60.0, 1),
            "total_volume": s.total_volume,
            "calories": s.estimated_calories
        }
        for s in sessions_query
    ]

    # 3. Body Measurements
    measurements_query = db.query(MeasurementEntry).filter(
        MeasurementEntry.user_id == current_user.id,
        MeasurementEntry.date >= since_date
    ).order_by(MeasurementEntry.date.asc()).all()

    measurement_data = [
        {
            "date": m.date.isoformat(),
            "waist": m.waist,
            "chest": m.chest,
            "arms": m.arms,
            "shoulders": m.shoulders,
            "thighs": m.thighs,
            "hips": m.hips,
            "neck": m.neck
        }
        for m in measurements_query
    ]

    # 4. Nutrition logs in period
    nutrition_query = db.query(NutritionLog).filter(
        NutritionLog.user_id == current_user.id,
        NutritionLog.date >= since_date
    ).all()

    # Aggregate nutrition by day
    nutrition_by_day: Dict[str, Dict[str, float]] = {}
    for n in nutrition_query:
        d_str = n.date.isoformat()
        if d_str not in nutrition_by_day:
            nutrition_by_day[d_str] = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
        nutrition_by_day[d_str]["calories"] += n.calories
        nutrition_by_day[d_str]["protein"] += n.protein
        nutrition_by_day[d_str]["carbs"] += n.carbs
        nutrition_by_day[d_str]["fat"] += n.fat

    nutrition_chart = [
        {
            "date": d,
            "calories": round(vals["calories"], 1),
            "protein": round(vals["protein"], 1),
            "carbs": round(vals["carbs"], 1),
            "fat": round(vals["fat"], 1)
        }
        for d, vals in sorted(nutrition_by_day.items())
    ]

    # 5. Personal records summary
    prs = db.query(PersonalRecord).filter(
        PersonalRecord.user_id == current_user.id
    ).all()
    pr_data = [
        {
            "exercise": p.exercise_name,
            "weight": p.max_weight,
            "reps": p.best_reps,
            "estimated_1rm": p.estimated_1rm,
            "date": p.achieved_date.isoformat()
        }
        for p in prs
    ]

    return {
        "timeframe": timeframe,
        "weight_history": weight_data,
        "workout_history": workout_data,
        "measurement_history": measurement_data,
        "nutrition_history": nutrition_chart,
        "prs": pr_data,
        "total_workouts": len(sessions_query),
        "total_volume_lifted": round(sum(s.total_volume for s in sessions_query), 1),
        "total_calories_burned": sum(s.estimated_calories for s in sessions_query)
    }
