from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.weight import WeightEntry
from backend.app.schemas.weight import (
    WeightEntryCreate, WeightEntryUpdate, WeightEntryOut, WeightStatsOut,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /weights  — list with optional day-range filter + pagination
# ---------------------------------------------------------------------------

@router.get("", response_model=List[WeightEntryOut])
def get_weights(
    days:   Optional[int] = Query(None, description="Last N days"),
    start:  Optional[date] = Query(None, description="Explicit start date"),
    end:    Optional[date] = Query(None, description="Explicit end date"),
    limit:  int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(WeightEntry).filter(WeightEntry.user_id == current_user.id)

    if days:
        q = q.filter(WeightEntry.date >= date.today() - timedelta(days=days))
    if start:
        q = q.filter(WeightEntry.date >= start)
    if end:
        q = q.filter(WeightEntry.date <= end)

    return (
        q.order_by(WeightEntry.date.asc(), WeightEntry.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------------
# GET /weights/stats
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=WeightStatsOut)
def get_weight_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == current_user.id)
        .order_by(WeightEntry.date.asc(), WeightEntry.created_at.asc())
        .all()
    )

    profile    = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    goal_weight = profile.goal_weight if profile else None

    if not entries:
        return WeightStatsOut(
            current_weight=profile.current_weight if profile else None,
            starting_weight=None,
            goal_weight=goal_weight,
            total_change=None,
            average_weekly_change=None,
            entries_count=0,
        )

    starting_weight = entries[0].weight
    current_weight  = entries[-1].weight
    total_change    = round(current_weight - starting_weight, 2)

    days_diff = (entries[-1].date - entries[0].date).days
    avg_weekly = round(total_change / max(1.0, days_diff / 7.0), 2) if days_diff >= 7 else total_change

    return WeightStatsOut(
        current_weight=current_weight,
        starting_weight=starting_weight,
        goal_weight=goal_weight,
        total_change=total_change,
        average_weekly_change=avg_weekly,
        entries_count=len(entries),
    )


# ---------------------------------------------------------------------------
# POST /weights  — create or upsert by date
# ---------------------------------------------------------------------------

@router.post("", response_model=WeightEntryOut, status_code=status.HTTP_201_CREATED)
def create_weight_entry(
    weight_in: WeightEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(WeightEntry).filter(
        WeightEntry.user_id == current_user.id,
        WeightEntry.date == weight_in.date,
    ).first()

    if existing:
        existing.weight = weight_in.weight
        if weight_in.notes is not None:
            existing.notes = weight_in.notes
        db.commit()
        db.refresh(existing)
        entry = existing
    else:
        entry = WeightEntry(
            user_id=current_user.id,
            weight=weight_in.weight,
            date=weight_in.date,
            notes=weight_in.notes,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

    # Keep profile.current_weight in sync with most-recent entry
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile:
        latest = (
            db.query(WeightEntry)
            .filter(WeightEntry.user_id == current_user.id)
            .order_by(WeightEntry.date.desc(), WeightEntry.created_at.desc())
            .first()
        )
        if latest:
            profile.current_weight = latest.weight
            db.commit()

    return entry


# ---------------------------------------------------------------------------
# PUT /weights/{entry_id}
# ---------------------------------------------------------------------------

@router.put("/{entry_id}", response_model=WeightEntryOut)
def update_weight_entry(
    entry_id: int,
    weight_in: WeightEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(WeightEntry).filter(
        WeightEntry.id == entry_id,
        WeightEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Weight entry not found.")

    for field, value in weight_in.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# DELETE /weights/{entry_id}
# ---------------------------------------------------------------------------

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(WeightEntry).filter(
        WeightEntry.id == entry_id,
        WeightEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Weight entry not found.")
    db.delete(entry)
    db.commit()
    return None
