import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.v1.api import api_router
# Import all models so SQLAlchemy registers them with Base
import backend.app.models


def _seed_admin():
    """Create the default admin account if no admin user exists yet."""
    from backend.app.models.user import User
    from backend.app.models.profile import Profile
    from backend.app.core.security import get_password_hash

    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.is_admin == True).first()
        if existing_admin:
            return

        # Also check if the admin email already exists as a regular user
        existing_user = db.query(User).filter(
            User.email == settings.ADMIN_EMAIL.lower()
        ).first()

        if existing_user:
            # Promote to admin
            existing_user.is_admin = True
            db.commit()
            print(f"[FitTrack] Promoted existing user '{existing_user.email}' to admin.")
            return

        admin = User(
            name=settings.ADMIN_NAME,
            email=settings.ADMIN_EMAIL.lower(),
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            is_admin=True,
            is_active=True,
        )
        db.add(admin)
        db.flush()

        profile = Profile(
            user_id=admin.id,
            fitness_goal="maintain",
            activity_level="moderate",
            training_days_per_week=4,
            unit_system="metric",
        )
        db.add(profile)
        db.commit()
        print(f"[FitTrack] Admin account created: {settings.ADMIN_EMAIL}")
    except Exception as exc:
        db.rollback()
        print(f"[FitTrack] Warning: could not seed admin account — {exc}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all DB tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning during DB table creation: {e}")

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Seed default admin
    _seed_admin()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)


# ---------------------------------------------------------------------------
# System routes
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["system"])
def root():
    return {
        "message": "Welcome to FitTrack API",
        "docs": "/docs",
        "health": "/api/health",
    }


# ---------------------------------------------------------------------------
# Global error handler — never leak stack traces to clients
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )
