"""
Stateless fitness calculator endpoints — no authentication required.
All formulas are server-side so the frontend never needs to duplicate math.
"""

from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter
from backend.app.services.fitness_calc import (
    calculate_bmi,
    calculate_bmr,
    calculate_tdee,
    calculate_target_macros,
    calculate_1rm_epley,
    calculate_1rm_brzycki,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class BMICalcRequest(BaseModel):
    weight_kg: float = Field(..., ge=20, le=400)
    height_cm: float = Field(..., ge=50, le=280)


class BMRCalcRequest(BaseModel):
    weight_kg: float = Field(..., ge=20, le=400)
    height_cm: float = Field(..., ge=50, le=280)
    age: int = Field(..., ge=10, le=120)
    gender: str = "male"


class TDEECalcRequest(BaseModel):
    bmr: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = "male"
    activity_level: str = "moderate"


class CalorieGoalRequest(BaseModel):
    tdee: int = Field(..., ge=800, le=8000)
    goal: str = "lose_fat"   # lose_fat | maintain | build_muscle | recomposition


class ProteinCalcRequest(BaseModel):
    weight_kg: float = Field(..., ge=20, le=400)
    goal: str = "build_muscle"


class OneRMCalcRequest(BaseModel):
    weight: float = Field(..., ge=1)
    reps: int = Field(..., ge=1, le=30)


class MacroSplitRequest(BaseModel):
    """
    Calculate protein / carb / fat grams from total daily calories.
    split: balanced | high_protein | low_carb | keto
    """
    calories: int = Field(..., ge=800, le=8000)
    split: str = Field("balanced", description="balanced | high_protein | low_carb | keto")


class TimelineCalcRequest(BaseModel):
    current_weight: float = Field(..., ge=20, le=400)
    goal_weight: float = Field(..., ge=20, le=400)
    weekly_rate_kg: float = Field(0.5, ge=0.1, le=1.5)


# ---------------------------------------------------------------------------
# 1. BMI
# ---------------------------------------------------------------------------

@router.post("/bmi")
def calc_bmi(data: BMICalcRequest):
    bmi, category = calculate_bmi(data.weight_kg, data.height_cm)
    h_m = data.height_cm / 100.0
    return {
        "bmi": bmi,
        "category": category,
        "healthy_weight_range_kg": [
            round(18.5 * h_m ** 2, 1),
            round(24.9 * h_m ** 2, 1),
        ],
    }


# ---------------------------------------------------------------------------
# 2. BMR
# ---------------------------------------------------------------------------

@router.post("/bmr")
def calc_bmr(data: BMRCalcRequest):
    bmr = calculate_bmr(data.weight_kg, data.height_cm, data.age, data.gender)
    return {
        "bmr": bmr,
        "formula": "Mifflin-St Jeor",
        "description": "Calories burned at complete rest per day.",
    }


# ---------------------------------------------------------------------------
# 3. TDEE
# ---------------------------------------------------------------------------

@router.post("/tdee")
def calc_tdee(data: TDEECalcRequest):
    bmr = data.bmr
    if not bmr:
        if data.weight_kg and data.height_cm and data.age:
            bmr = calculate_bmr(data.weight_kg, data.height_cm, data.age, data.gender)
        else:
            bmr = 1700
    tdee = calculate_tdee(bmr, data.activity_level)
    return {"bmr": bmr, "tdee": tdee, "activity_level": data.activity_level}


# ---------------------------------------------------------------------------
# 4. Calorie goal (deficit/surplus)
# ---------------------------------------------------------------------------

@router.post("/calorie-goal")
def calc_calorie_goal(data: CalorieGoalRequest):
    macros = calculate_target_macros(data.tdee, data.goal, weight_kg=70.0)
    return {
        "tdee": data.tdee,
        "goal": data.goal,
        "target_calories": macros["target_calories"],
        "calorie_difference": macros["target_calories"] - data.tdee,
    }


# ---------------------------------------------------------------------------
# 5. Protein
# ---------------------------------------------------------------------------

@router.post("/protein")
def calc_protein(data: ProteinCalcRequest):
    rates = {
        "lose_fat":      (2.0, 2.4),
        "build_muscle":  (1.8, 2.2),
        "maintain":      (1.4, 1.8),
        "recomposition": (2.0, 2.4),
    }
    low, high = rates.get(data.goal.lower(), (1.6, 2.0))
    return {
        "weight_kg": data.weight_kg,
        "goal": data.goal,
        "protein_min_g": round(data.weight_kg * low),
        "protein_max_g": round(data.weight_kg * high),
        "recommended_g": round(data.weight_kg * ((low + high) / 2)),
    }


# ---------------------------------------------------------------------------
# 6. 1RM (Epley + Brzycki + percentage table)
# ---------------------------------------------------------------------------

@router.post("/1rm")
def calc_1rm(data: OneRMCalcRequest):
    epley   = calculate_1rm_epley(data.weight, data.reps)
    brzycki = calculate_1rm_brzycki(data.weight, data.reps)
    percentages = [
        {"reps": 1,  "pct": 100, "weight": round(epley * 1.00, 1)},
        {"reps": 2,  "pct": 95,  "weight": round(epley * 0.95, 1)},
        {"reps": 3,  "pct": 93,  "weight": round(epley * 0.93, 1)},
        {"reps": 4,  "pct": 90,  "weight": round(epley * 0.90, 1)},
        {"reps": 5,  "pct": 87,  "weight": round(epley * 0.87, 1)},
        {"reps": 6,  "pct": 85,  "weight": round(epley * 0.85, 1)},
        {"reps": 8,  "pct": 80,  "weight": round(epley * 0.80, 1)},
        {"reps": 10, "pct": 75,  "weight": round(epley * 0.75, 1)},
        {"reps": 12, "pct": 70,  "weight": round(epley * 0.70, 1)},
    ]
    return {
        "weight": data.weight,
        "reps": data.reps,
        "estimated_1rm_epley": epley,
        "estimated_1rm_brzycki": brzycki,
        "rep_max_table": percentages,
    }


# ---------------------------------------------------------------------------
# 7. Macronutrient split  ← previously missing!
# ---------------------------------------------------------------------------

MACRO_SPLITS = {
    "balanced":    {"protein": 0.30, "carbs": 0.45, "fat": 0.25},
    "high_protein":{"protein": 0.40, "carbs": 0.35, "fat": 0.25},
    "low_carb":    {"protein": 0.35, "carbs": 0.20, "fat": 0.45},
    "keto":        {"protein": 0.25, "carbs": 0.05, "fat": 0.70},
}

@router.post("/macros")
def calc_macro_split(data: MacroSplitRequest):
    key = data.split.lower()
    split = MACRO_SPLITS.get(key, MACRO_SPLITS["balanced"])

    p_pct = split["protein"]
    c_pct = split["carbs"]
    f_pct = split["fat"]

    p_g = round((data.calories * p_pct) / 4)
    c_g = round((data.calories * c_pct) / 4)
    f_g = round((data.calories * f_pct) / 9)

    # Verify calories (rounding artefacts)
    check_cals = round(p_g * 4 + c_g * 4 + f_g * 9)

    return {
        "calories": data.calories,
        "split": key,
        "macros": {
            "protein_g":  p_g,
            "carbs_g":    c_g,
            "fat_g":      f_g,
            "protein_pct": round(p_pct * 100),
            "carbs_pct":   round(c_pct * 100),
            "fat_pct":     round(f_pct * 100),
        },
        "calories_check": check_cals,
        "available_splits": list(MACRO_SPLITS.keys()),
    }


# ---------------------------------------------------------------------------
# 8. Weight goal timeline
# ---------------------------------------------------------------------------

@router.post("/timeline")
def calc_timeline(data: TimelineCalcRequest):
    diff  = abs(data.current_weight - data.goal_weight)
    rate  = max(0.1, data.weekly_rate_kg)
    weeks = round(diff / rate, 1)
    days  = int(weeks * 7)
    return {
        "current_weight": data.current_weight,
        "goal_weight": data.goal_weight,
        "total_delta_kg": round(diff, 1),
        "direction": "lose" if data.current_weight > data.goal_weight else "gain",
        "estimated_weeks": weeks,
        "estimated_days": days,
    }
