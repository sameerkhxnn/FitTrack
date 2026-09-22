from typing import Tuple, Dict, Any, Optional
from datetime import date

def calculate_age(born: Optional[date]) -> int:
    if not born:
        return 25  # default adult age if not provided
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

def calculate_bmi(weight_kg: float, height_cm: float) -> Tuple[float, str]:
    if not weight_kg or not height_cm or height_cm <= 0:
        return 0.0, "Unknown"
    
    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m ** 2), 1)
    
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal weight"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"
        
    return bmi, category

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: Optional[str] = "male") -> int:
    if not weight_kg or not height_cm or weight_kg <= 0 or height_cm <= 0:
        return 0
    # Mifflin-St Jeor formula
    base_bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age)
    if gender and gender.lower() == "female":
        return int(base_bmr - 161)
    return int(base_bmr + 5)

def calculate_tdee(bmr: int, activity_level: str) -> int:
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    multiplier = multipliers.get(activity_level.lower(), 1.55)
    return int(bmr * multiplier)

def calculate_target_macros(tdee: int, goal: str, weight_kg: float) -> Dict[str, Any]:
    # Adjust calories by goal
    goal_key = (goal or "maintain").lower()
    if goal_key == "lose_fat":
        target_calories = max(1200, tdee - 500)
        protein_multiplier = 2.2  # higher protein during deficit to preserve lean mass
    elif goal_key == "build_muscle":
        target_calories = tdee + 300
        protein_multiplier = 2.0
    elif goal_key == "recomposition":
        target_calories = tdee - 200
        protein_multiplier = 2.2
    else:  # maintain
        target_calories = tdee
        protein_multiplier = 1.8
        
    # Protein: around protein_multiplier * weight_kg
    protein_g = int(weight_kg * protein_multiplier) if weight_kg else int(target_calories * 0.25 / 4)
    protein_min_g = int(weight_kg * 1.6) if weight_kg else int(protein_g * 0.8)
    protein_max_g = int(weight_kg * 2.4) if weight_kg else int(protein_g * 1.2)
    
    # Fat: 25% of calories
    fat_cals = target_calories * 0.25
    fat_g = int(fat_cals / 9)
    
    # Carbs: Remaining calories
    carb_cals = max(0, target_calories - (protein_g * 4) - fat_cals)
    carbs_g = int(carb_cals / 4)
    
    return {
        "target_calories": target_calories,
        "protein_g": protein_g,
        "protein_min_g": protein_min_g,
        "protein_max_g": protein_max_g,
        "fat_g": fat_g,
        "carbs_g": carbs_g
    }

def calculate_1rm_epley(weight: float, reps: int) -> float:
    """Epley formula for 1RM calculation: 1RM = Weight * (1 + Reps/30)"""
    if reps <= 0 or weight <= 0:
        return 0.0
    if reps == 1:
        return round(float(weight), 1)
    return round(float(weight * (1.0 + (reps / 30.0))), 1)

def calculate_1rm_brzycki(weight: float, reps: int) -> float:
    """Brzycki formula: 1RM = Weight / (1.0278 - (0.0278 * Reps))"""
    if reps <= 0 or weight <= 0:
        return 0.0
    if reps == 1:
        return round(float(weight), 1)
    denom = 1.0278 - (0.0278 * reps)
    if denom <= 0:
        return round(float(weight), 1)
    return round(float(weight / denom), 1)
