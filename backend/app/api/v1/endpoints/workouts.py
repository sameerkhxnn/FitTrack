from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.workout import (
    WorkoutRoutine, RoutineExercise, WorkoutSession, SessionExerciseSet, PersonalRecord
)
from backend.app.schemas.workout import (
    RoutineCreate, RoutineUpdate, RoutineOut, SessionCreate, SessionOut, PersonalRecordOut
)
from backend.app.services.fitness_calc import calculate_1rm_epley

router = APIRouter()

# ----------------- ROUTINES -----------------

@router.get("/routines", response_model=List[RoutineOut])
def get_user_routines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routines = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.user_id == current_user.id
    ).all()

    # If no routines exist, seed starter templates
    if not routines:
        starter_templates = [
            {
                "name": "Push Day (Chest, Shoulders, Triceps)",
                "description": "Upper body pressing focus to build upper strength and chest mass.",
                "exercises": [
                    {"name": "Barbell Bench Press", "exercise_order": 0, "target_sets": 4, "target_reps": 8, "target_weight": 60.0, "rest_time_seconds": 120},
                    {"name": "Incline Dumbbell Press", "exercise_order": 1, "target_sets": 3, "target_reps": 10, "target_weight": 22.5, "rest_time_seconds": 90},
                    {"name": "Seated Overhead Dumbbell Press", "exercise_order": 2, "target_sets": 3, "target_reps": 10, "target_weight": 18.0, "rest_time_seconds": 90},
                    {"name": "Dumbbell Lateral Raises", "exercise_order": 3, "target_sets": 4, "target_reps": 15, "target_weight": 8.0, "rest_time_seconds": 60},
                    {"name": "Triceps Cable Pushdowns", "exercise_order": 4, "target_sets": 3, "target_reps": 12, "target_weight": 25.0, "rest_time_seconds": 60}
                ]
            },
            {
                "name": "Pull Day (Back & Biceps)",
                "description": "Upper body pulling session for back thickness, lats, and bicep peaks.",
                "exercises": [
                    {"name": "Barbell Deadlift", "exercise_order": 0, "target_sets": 4, "target_reps": 6, "target_weight": 100.0, "rest_time_seconds": 150},
                    {"name": "Lat Pulldown", "exercise_order": 1, "target_sets": 4, "target_reps": 10, "target_weight": 55.0, "rest_time_seconds": 90},
                    {"name": "Bent-Over Barbell Row", "exercise_order": 2, "target_sets": 3, "target_reps": 8, "target_weight": 60.0, "rest_time_seconds": 90},
                    {"name": "Incline Dumbbell Bicep Curl", "exercise_order": 3, "target_sets": 3, "target_reps": 12, "target_weight": 14.0, "rest_time_seconds": 60},
                    {"name": "Face Pulls", "exercise_order": 4, "target_sets": 4, "target_reps": 15, "target_weight": 20.0, "rest_time_seconds": 60}
                ]
            },
            {
                "name": "Leg Day & Core",
                "description": "Lower body strength and endurance foundation.",
                "exercises": [
                    {"name": "Barbell Back Squat", "exercise_order": 0, "target_sets": 4, "target_reps": 8, "target_weight": 80.0, "rest_time_seconds": 150},
                    {"name": "Romanian Deadlift", "exercise_order": 1, "target_sets": 3, "target_reps": 10, "target_weight": 70.0, "rest_time_seconds": 90},
                    {"name": "Leg Press", "exercise_order": 2, "target_sets": 3, "target_reps": 12, "target_weight": 140.0, "rest_time_seconds": 90},
                    {"name": "Standing Calf Raises", "exercise_order": 3, "target_sets": 4, "target_reps": 15, "target_weight": 50.0, "rest_time_seconds": 60},
                    {"name": "Hanging Leg Raises", "exercise_order": 4, "target_sets": 3, "target_reps": 15, "target_weight": 0.0, "rest_time_seconds": 60}
                ]
            }
        ]
        for tmpl in starter_templates:
            r = WorkoutRoutine(
                user_id=current_user.id,
                name=tmpl["name"],
                description=tmpl["description"]
            )
            db.add(r)
            db.flush()
            for ex in tmpl["exercises"]:
                e = RoutineExercise(
                    routine_id=r.id,
                    name=ex["name"],
                    exercise_order=ex["exercise_order"],
                    target_sets=ex["target_sets"],
                    target_reps=ex["target_reps"],
                    target_weight=ex["target_weight"],
                    rest_time_seconds=ex["rest_time_seconds"]
                )
                db.add(e)
        db.commit()
        routines = db.query(WorkoutRoutine).filter(WorkoutRoutine.user_id == current_user.id).all()

    return routines

@router.post("/routines", response_model=RoutineOut, status_code=status.HTTP_201_CREATED)
def create_routine(
    routine_in: RoutineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routine = WorkoutRoutine(
        user_id=current_user.id,
        name=routine_in.name,
        description=routine_in.description
    )
    db.add(routine)
    db.flush()

    for idx, ex_in in enumerate(routine_in.exercises):
        exercise = RoutineExercise(
            routine_id=routine.id,
            name=ex_in.name,
            exercise_order=idx,
            target_sets=ex_in.target_sets,
            target_reps=ex_in.target_reps,
            target_weight=ex_in.target_weight,
            rest_time_seconds=ex_in.rest_time_seconds,
            notes=ex_in.notes
        )
        db.add(exercise)

    db.commit()
    db.refresh(routine)
    return routine

@router.get("/routines/{routine_id}", response_model=RoutineOut)
def get_routine(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routine = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id == routine_id,
        WorkoutRoutine.user_id == current_user.id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine

@router.put("/routines/{routine_id}", response_model=RoutineOut)
def update_routine(
    routine_id: int,
    routine_in: RoutineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routine = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id == routine_id,
        WorkoutRoutine.user_id == current_user.id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    if routine_in.name is not None:
        routine.name = routine_in.name
    if routine_in.description is not None:
        routine.description = routine_in.description

    if routine_in.exercises is not None:
        # Replace exercises
        db.query(RoutineExercise).filter(RoutineExercise.routine_id == routine.id).delete()
        for idx, ex_in in enumerate(routine_in.exercises):
            exercise = RoutineExercise(
                routine_id=routine.id,
                name=ex_in.name,
                exercise_order=idx,
                target_sets=ex_in.target_sets,
                target_reps=ex_in.target_reps,
                target_weight=ex_in.target_weight,
                rest_time_seconds=ex_in.rest_time_seconds,
                notes=ex_in.notes
            )
            db.add(exercise)

    db.commit()
    db.refresh(routine)
    return routine

@router.delete("/routines/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routine = db.query(WorkoutRoutine).filter(
        WorkoutRoutine.id == routine_id,
        WorkoutRoutine.user_id == current_user.id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    db.delete(routine)
    db.commit()
    return None

# ----------------- SESSIONS & LIVE LOGGING -----------------

@router.get("/sessions", response_model=List[SessionOut])
def get_workout_sessions(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id
    ).order_by(WorkoutSession.date.desc(), WorkoutSession.id.desc()).limit(limit).all()

@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session_details(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")
    return session

@router.post("/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def record_workout_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate total volume & estimated calories
    calc_volume = 0.0
    for s in session_in.sets:
        if s.completed:
            calc_volume += (s.weight * s.reps)

    duration = session_in.duration_seconds
    calories = session_in.estimated_calories or max(50, int((duration / 60.0) * 6.5))

    session = WorkoutSession(
        user_id=current_user.id,
        routine_id=session_in.routine_id,
        name=session_in.name,
        date=session_in.date,
        start_time=session_in.start_time,
        end_time=session_in.end_time or datetime.now(timezone.utc),
        duration_seconds=duration,
        total_volume=round(calc_volume, 1),
        estimated_calories=calories,
        notes=session_in.notes
    )
    db.add(session)
    db.flush()

    # Process sets & check for personal records
    for s_in in session_in.sets:
        is_new_pr = False
        if s_in.completed and s_in.weight > 0 and s_in.reps > 0:
            est_1rm = calculate_1rm_epley(s_in.weight, s_in.reps)
            
            # Check existing PR for this exercise
            existing_pr = db.query(PersonalRecord).filter(
                PersonalRecord.user_id == current_user.id,
                PersonalRecord.exercise_name.ilike(s_in.exercise_name.strip())
            ).first()

            if not existing_pr:
                # First time doing this exercise = initial PR!
                is_new_pr = True
                new_pr = PersonalRecord(
                    user_id=current_user.id,
                    exercise_name=s_in.exercise_name.strip(),
                    max_weight=s_in.weight,
                    best_reps=s_in.reps,
                    estimated_1rm=est_1rm,
                    achieved_date=session_in.date
                )
                db.add(new_pr)
            else:
                if est_1rm > existing_pr.estimated_1rm or s_in.weight > existing_pr.max_weight:
                    is_new_pr = True
                    existing_pr.estimated_1rm = max(existing_pr.estimated_1rm, est_1rm)
                    existing_pr.max_weight = max(existing_pr.max_weight, s_in.weight)
                    existing_pr.best_reps = max(existing_pr.best_reps, s_in.reps)
                    existing_pr.achieved_date = session_in.date

        set_record = SessionExerciseSet(
            session_id=session.id,
            exercise_name=s_in.exercise_name.strip(),
            set_number=s_in.set_number,
            reps=s_in.reps,
            weight=s_in.weight,
            completed=s_in.completed,
            is_pr=is_new_pr,
            notes=s_in.notes
        )
        db.add(set_record)

    db.commit()
    db.refresh(session)
    return session

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")

    db.delete(session)
    db.commit()
    return None

# ----------------- PERSONAL RECORDS -----------------

@router.get("/prs", response_model=List[PersonalRecordOut])
def get_personal_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PersonalRecord).filter(
        PersonalRecord.user_id == current_user.id
    ).order_by(PersonalRecord.achieved_date.desc()).all()
