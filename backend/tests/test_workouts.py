from datetime import date

def test_workout_routine_and_session(client, auth_headers):
    # 1. Create a routine
    routine_res = client.post(
        "/api/v1/workouts/routines",
        json={
            "name": "Upper Power",
            "description": "Heavy bench & rows",
            "exercises": [
                {
                    "name": "Barbell Bench Press",
                    "target_sets": 3,
                    "target_reps": 8,
                    "target_weight": 80.0,
                    "rest_time_seconds": 120
                }
            ]
        },
        headers=auth_headers
    )
    assert routine_res.status_code == 201
    routine = routine_res.json()
    assert routine["name"] == "Upper Power"
    assert len(routine["exercises"]) == 1

    # 2. Record a live workout session
    session_res = client.post(
        "/api/v1/workouts/sessions",
        json={
            "routine_id": routine["id"],
            "name": "Upper Power Live",
            "date": date.today().isoformat(),
            "duration_seconds": 3600,
            "notes": "Felt fantastic",
            "sets": [
                {"exercise_name": "Barbell Bench Press", "set_number": 1, "reps": 8, "weight": 80.0, "completed": True},
                {"exercise_name": "Barbell Bench Press", "set_number": 2, "reps": 8, "weight": 80.0, "completed": True},
                {"exercise_name": "Barbell Bench Press", "set_number": 3, "reps": 8, "weight": 80.0, "completed": True},
            ]
        },
        headers=auth_headers
    )
    assert session_res.status_code == 201
    sess = session_res.json()
    # Total volume: 8 * 80 * 3 = 1920
    assert sess["total_volume"] == 1920.0

    # 3. Check that personal records were created and 1RM was estimated
    prs_res = client.get("/api/v1/workouts/prs", headers=auth_headers)
    assert prs_res.status_code == 200
    prs = prs_res.json()
    assert len(prs) >= 1
    bench_pr = next(p for p in prs if p["exercise_name"] == "Barbell Bench Press")
    assert bench_pr["max_weight"] == 80.0
    # Epley: 80 * (1 + 8/30) = 80 * 1.2666... = ~101.3
    assert bench_pr["estimated_1rm"] > 100.0
