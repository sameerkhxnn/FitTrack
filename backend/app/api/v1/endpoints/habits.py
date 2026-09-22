from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.habit import WaterLog, DailyHabit
from backend.app.schemas.habit import (
    WaterLogUpdate, WaterLogOut,
    DailyHabitUpdate, DailyHabitOut,
)

router = APIRouter()


# ===========================================================================
# WATER TRACKING
# ===========================================================================

def _pct(amount_ml: int, goal_ml: int) -> float:
    return round(min(100.0, (amount_ml / max(1, goal_ml)) * 100.0), 1)


# ---------------------------------------------------------------------------
# GET /habits/water  — single day (creates default if missing)
# ---------------------------------------------------------------------------

@router.get("/water", response_model=WaterLogOut)
def get_water_log(
    log_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = log_date or date.today()
    log = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == target_date,
    ).first()

    if not log:
        log = WaterLog(user_id=current_user.id, date=target_date, amount_ml=0, goal_ml=2500)
        db.add(log)
        db.commit()
        db.refresh(log)

    return {**log.__dict__, "percentage": _pct(log.amount_ml, log.goal_ml)}


# ---------------------------------------------------------------------------
# POST /habits/water  — upsert water amount for a date
# ---------------------------------------------------------------------------

@router.post("/water", response_model=WaterLogOut)
def update_water_log(
    water_in: WaterLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == water_in.date,
    ).first()

    if not log:
        log = WaterLog(
            user_id=current_user.id,
            date=water_in.date,
            amount_ml=water_in.amount_ml,
            goal_ml=water_in.goal_ml or 2500,
        )
        db.add(log)
    else:
        log.amount_ml = max(0, water_in.amount_ml)
        if water_in.goal_ml:
            log.goal_ml = water_in.goal_ml

    db.commit()
    db.refresh(log)
    return {**log.__dict__, "percentage": _pct(log.amount_ml, log.goal_ml)}


# ---------------------------------------------------------------------------
# GET /habits/water/history  — range of daily water logs
# ---------------------------------------------------------------------------

@router.get("/water/history")
def get_water_history(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = date.today() - timedelta(days=days)
    logs = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == current_user.id, WaterLog.date >= since)
        .order_by(WaterLog.date.asc())
        .all()
    )
    return [
        {
            "date": str(l.date),
            "amount_ml": l.amount_ml,
            "goal_ml": l.goal_ml,
            "percentage": _pct(l.amount_ml, l.goal_ml),
        }
        for l in logs
    ]


# ===========================================================================
# DAILY HABIT CHECKLIST
# ===========================================================================

# ---------------------------------------------------------------------------
# GET /habits/checklist  — single day (creates default if missing)
# ---------------------------------------------------------------------------

@router.get("/checklist", response_model=DailyHabitOut)
def get_daily_habit(
    habit_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = habit_date or date.today()
    habit = db.query(DailyHabit).filter(
        DailyHabit.user_id == current_user.id,
        DailyHabit.date == target_date,
    ).first()

    if not habit:
        habit = DailyHabit(
            user_id=current_user.id,
            date=target_date,
            sleep_hours=7.5,
            steps=0,
            stretched=False,
            cardio_done=False,
            workout_done=False,
        )
        db.add(habit)
        db.commit()
        db.refresh(habit)

    return habit


# ---------------------------------------------------------------------------
# POST /habits/checklist  — upsert daily habits
# ---------------------------------------------------------------------------

@router.post("/checklist", response_model=DailyHabitOut)
def update_daily_habit(
    habit_in: DailyHabitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    habit = db.query(DailyHabit).filter(
        DailyHabit.user_id == current_user.id,
        DailyHabit.date == habit_in.date,
    ).first()

    if not habit:
        habit = DailyHabit(
            user_id=current_user.id,
            date=habit_in.date,
            sleep_hours=habit_in.sleep_hours if habit_in.sleep_hours is not None else 7.5,
            steps=habit_in.steps if habit_in.steps is not None else 0,
            stretched=habit_in.stretched if habit_in.stretched is not None else False,
            cardio_done=habit_in.cardio_done if habit_in.cardio_done is not None else False,
            workout_done=habit_in.workout_done if habit_in.workout_done is not None else False,
            notes=habit_in.notes,
        )
        db.add(habit)
    else:
        for field, value in habit_in.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return habit


# ---------------------------------------------------------------------------
# GET /habits/history  — range of daily habit records
# ---------------------------------------------------------------------------

@router.get("/history")
def get_habits_history(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = date.today() - timedelta(days=days)
    habits = (
        db.query(DailyHabit)
        .filter(DailyHabit.user_id == current_user.id, DailyHabit.date >= since)
        .order_by(DailyHabit.date.asc())
        .all()
    )

    # Compute streaks inline
    total_days    = len(habits)
    workout_days  = sum(1 for h in habits if h.workout_done)
    cardio_days   = sum(1 for h in habits if h.cardio_done)
    stretch_days  = sum(1 for h in habits if h.stretched)
    avg_sleep     = round(sum(h.sleep_hours for h in habits) / max(1, total_days), 1)
    avg_steps     = round(sum(h.steps for h in habits) / max(1, total_days))

    return {
        "days": days,
        "summary": {
            "total_days_logged": total_days,
            "workout_days": workout_days,
            "cardio_days": cardio_days,
            "stretch_days": stretch_days,
            "avg_sleep_hours": avg_sleep,
            "avg_steps": avg_steps,
        },
        "entries": [
            {
                "date": str(h.date),
                "sleep_hours": h.sleep_hours,
                "steps": h.steps,
                "stretched": h.stretched,
                "cardio_done": h.cardio_done,
                "workout_done": h.workout_done,
                "notes": h.notes,
            }
            for h in habits
        ],
    }


# ---------------------------------------------------------------------------
# GET /habits/streak  — current consecutive workout streak
# ---------------------------------------------------------------------------

@router.get("/streak")
def get_workout_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns current streak and longest streak of consecutive workout days."""
    habits = (
        db.query(DailyHabit)
        .filter(DailyHabit.user_id == current_user.id)
        .order_by(DailyHabit.date.asc())
        .all()
    )

    workout_dates = sorted({h.date for h in habits if h.workout_done})

    current_streak = 0
    longest_streak = 0
    streak = 0
    prev   = None

    for d in reversed(workout_dates):
        if prev is None or (prev - d).days == 1:
            streak += 1
            prev = d
        else:
            break
    current_streak = streak

    streak = 1
    for i in range(1, len(workout_dates)):
        if (workout_dates[i] - workout_dates[i - 1]).days == 1:
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 1
    if workout_dates:
        longest_streak = max(longest_streak, streak)

    return {
        "current_streak_days": current_streak,
        "longest_streak_days": longest_streak,
        "total_workout_days": len(workout_dates),
    }
