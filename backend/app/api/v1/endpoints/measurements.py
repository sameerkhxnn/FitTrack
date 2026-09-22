from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.measurement import MeasurementEntry
from backend.app.schemas.measurement import (
    MeasurementCreate, MeasurementUpdate, MeasurementOut, MeasurementComparisonOut
)

router = APIRouter()

@router.get("", response_model=List[MeasurementOut])
def get_measurements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(MeasurementEntry).filter(
        MeasurementEntry.user_id == current_user.id
    ).order_by(MeasurementEntry.date.desc()).all()

@router.post("", response_model=MeasurementOut, status_code=status.HTTP_201_CREATED)
def create_measurement(
    measurement_in: MeasurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if entry already exists on this date
    existing = db.query(MeasurementEntry).filter(
        MeasurementEntry.user_id == current_user.id,
        MeasurementEntry.date == measurement_in.date
    ).first()

    if existing:
        update_data = measurement_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    new_measurement = MeasurementEntry(
        user_id=current_user.id,
        **measurement_in.model_dump()
    )
    db.add(new_measurement)
    db.commit()
    db.refresh(new_measurement)
    return new_measurement

@router.put("/{measurement_id}", response_model=MeasurementOut)
def update_measurement(
    measurement_id: int,
    measurement_in: MeasurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(MeasurementEntry).filter(
        MeasurementEntry.id == measurement_id,
        MeasurementEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Measurement entry not found")

    update_data = measurement_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_measurement(
    measurement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(MeasurementEntry).filter(
        MeasurementEntry.id == measurement_id,
        MeasurementEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Measurement entry not found")

    db.delete(entry)
    db.commit()
    return None

@router.get("/compare", response_model=MeasurementComparisonOut)
def compare_measurements(
    date1: date = Query(..., description="First date (YYYY-MM-DD)"),
    date2: date = Query(..., description="Second date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    m1 = db.query(MeasurementEntry).filter(
        MeasurementEntry.user_id == current_user.id,
        MeasurementEntry.date == date1
    ).first()
    m2 = db.query(MeasurementEntry).filter(
        MeasurementEntry.user_id == current_user.id,
        MeasurementEntry.date == date2
    ).first()

    if not m1 or not m2:
        raise HTTPException(
            status_code=404, 
            detail="Measurements for one or both of the selected dates were not found."
        )

    sites = ["waist", "chest", "arms", "shoulders", "thighs", "hips", "neck"]
    diffs = {}
    for site in sites:
        val1 = getattr(m1, site)
        val2 = getattr(m2, site)
        if val1 is not None and val2 is not None:
            diffs[site] = round(val2 - val1, 1)
        else:
            diffs[site] = None

    return MeasurementComparisonOut(
        first_date=date1,
        second_date=date2,
        diffs=diffs
    )
