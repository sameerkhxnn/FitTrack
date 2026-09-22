from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    admin,
    auth,
    profiles,
    weights,
    measurements,
    workouts,
    nutrition,
    habits,
    calculators,
    analytics,
    photos,
    achievements,
    settings,
)

api_router = APIRouter()

# Public / user-facing routes
api_router.include_router(auth.router,         prefix="/auth",         tags=["auth"])
api_router.include_router(profiles.router,     prefix="/profile",      tags=["profile"])
api_router.include_router(weights.router,      prefix="/weights",      tags=["weights"])
api_router.include_router(measurements.router, prefix="/measurements",  tags=["measurements"])
api_router.include_router(workouts.router,     prefix="/workouts",     tags=["workouts"])
api_router.include_router(nutrition.router,    prefix="/nutrition",    tags=["nutrition"])
api_router.include_router(habits.router,       prefix="/habits",       tags=["habits"])
api_router.include_router(calculators.router,  prefix="/calculators",  tags=["calculators"])
api_router.include_router(analytics.router,    prefix="/analytics",    tags=["analytics"])
api_router.include_router(photos.router,       prefix="/photos",       tags=["photos"])
api_router.include_router(achievements.router, prefix="/achievements", tags=["achievements"])
api_router.include_router(settings.router,     prefix="/settings",     tags=["settings"])

# Admin routes — all protected by get_current_admin_user dependency
api_router.include_router(admin.router,        prefix="/admin",        tags=["admin"])
