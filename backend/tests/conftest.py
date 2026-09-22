import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db
import backend.app.models  # registers all models with Base

# ---------------------------------------------------------------------------
# In-memory SQLite — isolated per test function
# ---------------------------------------------------------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    # Always build from the current model metadata — picks up new columns
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def auth_headers(client):
    """Register a plain user and return auth headers."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Athlete",
            "email": "athlete@example.com",
            "password": "Password123!",
            "height": 180.0,
            "gender": "male",
        },
    )
    assert res.status_code == 201, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, db_session):
    """
    Register a user, then promote them to admin directly via the
    test db_session (avoids touching the real fittrack.db file).
    """
    from backend.app.models.user import User

    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Super Admin",
            "email": "superadmin@fittrack.dev",
            "password": "Admin1234!",
            "height": 180.0,
            "gender": "male",
        },
    )
    assert res.status_code == 201, res.text
    token   = res.json()["access_token"]
    user_id = res.json()["user"]["id"]

    # Promote via the injected test session
    user = db_session.query(User).filter(User.id == user_id).first()
    user.is_admin = True
    db_session.commit()

    return {"Authorization": f"Bearer {token}"}
