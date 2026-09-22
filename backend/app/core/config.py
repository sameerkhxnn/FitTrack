import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FitTrack API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "fittrack-super-secret-development-jwt-key-2026-production-ready"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Admin seed account — only created if no admin exists yet
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@fittrack.dev")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "FitTrack@Admin2026!")
    ADMIN_NAME: str = os.getenv("ADMIN_NAME", "FitTrack Admin")

    # Database — PostgreSQL first, automatic SQLite fallback for local dev
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/fittrack"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./fittrack.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        # Vercel deployments
        "https://fittrack.vercel.app",
        "https://fittrack-sameerkhxnn.vercel.app",
        "https://fit-track.vercel.app",
        # Allow all Vercel preview URLs for this project
        "https://*.vercel.app",
        "*",
    ]

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
