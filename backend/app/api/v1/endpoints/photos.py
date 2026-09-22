import os
import shutil
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.photo import ProgressPhoto
from backend.app.schemas.photo import ProgressPhotoOut, ProgressPhotoUpdate, ProgressPhotoComparisonOut

router = APIRouter()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# GET /photos
# ---------------------------------------------------------------------------

@router.get("", response_model=List[ProgressPhotoOut])
def get_progress_photos(
    pose: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ProgressPhoto).filter(ProgressPhoto.user_id == current_user.id)
    if pose:
        q = q.filter(ProgressPhoto.pose == pose.lower())
    return q.order_by(ProgressPhoto.date.desc(), ProgressPhoto.created_at.desc()).all()


# ---------------------------------------------------------------------------
# POST /photos  — upload new photo
# ---------------------------------------------------------------------------

@router.post("", response_model=ProgressPhotoOut, status_code=status.HTTP_201_CREATED)
def upload_progress_photo(
    photo: UploadFile = File(...),
    photo_date: Optional[str] = Form(None),
    weight: Optional[float] = Form(None),
    pose: str = Form("front"),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if photo.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Allowed: JPEG, PNG, WebP.",
        )

    user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)

    ext = os.path.splitext(photo.filename)[1] or ".jpg"
    safe_name = (
        f"{date.today().strftime('%Y%m%d')}_{pose}_{len(os.listdir(user_upload_dir)) + 1}{ext}"
    )
    file_path = os.path.join(user_upload_dir, safe_name)

    with open(file_path, "wb") as buf:
        shutil.copyfileobj(photo.file, buf)

    image_url    = f"/uploads/user_{current_user.id}/{safe_name}"
    parsed_date  = date.fromisoformat(photo_date) if photo_date else date.today()

    new_photo = ProgressPhoto(
        user_id=current_user.id,
        date=parsed_date,
        weight=weight,
        pose=pose.lower(),
        image_url=image_url,
        notes=notes,
    )
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    return new_photo


# ---------------------------------------------------------------------------
# PUT /photos/{photo_id}  — edit metadata (date, weight, pose, notes)
# ---------------------------------------------------------------------------

@router.put("/{photo_id}", response_model=ProgressPhotoOut)
def update_photo_metadata(
    photo_id: int,
    photo_in: ProgressPhotoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user.id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found.")

    for field, value in photo_in.model_dump(exclude_unset=True).items():
        setattr(photo, field, value)

    db.commit()
    db.refresh(photo)
    return photo


# ---------------------------------------------------------------------------
# DELETE /photos/{photo_id}
# ---------------------------------------------------------------------------

@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_progress_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user.id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found.")

    local_path = "." + photo.image_url
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except OSError:
            pass

    db.delete(photo)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# GET /photos/compare
# ---------------------------------------------------------------------------

@router.get("/compare", response_model=ProgressPhotoComparisonOut)
def compare_photos(
    before_id: int = Query(...),
    after_id:  int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p1 = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == before_id,
        ProgressPhoto.user_id == current_user.id,
    ).first()
    p2 = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == after_id,
        ProgressPhoto.user_id == current_user.id,
    ).first()

    if not p1 or not p2:
        raise HTTPException(status_code=404, detail="One or both photos not found.")

    weight_diff = round(p2.weight - p1.weight, 1) if (p1.weight and p2.weight) else None
    days_apart  = abs((p2.date - p1.date).days)

    return ProgressPhotoComparisonOut(
        before_photo=p1,
        after_photo=p2,
        weight_diff=weight_diff,
        days_apart=days_apart,
    )
