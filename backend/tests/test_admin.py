"""
Admin endpoint tests.
Covers: stats, user list, user detail, update, password reset,
        broadcast, growth, activity, and access control.
"""

import pytest


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def regular_headers(client):
    """Register a plain user; returns (headers, user_id)."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Regular Joe",
            "email": "joe@fittrack.dev",
            "password": "Joe1234!",
        },
    )
    assert res.status_code == 201, res.text
    token   = res.json()["access_token"]
    user_id = res.json()["user"]["id"]
    return {"Authorization": f"Bearer {token}"}, user_id


# ---------------------------------------------------------------------------
# Access control
# ---------------------------------------------------------------------------

def test_admin_requires_admin_role(client, regular_headers):
    headers, _ = regular_headers
    r = client.get("/api/v1/admin/stats", headers=headers)
    assert r.status_code == 403
    assert "Admin" in r.json()["detail"]


def test_admin_requires_auth(client):
    r = client.get("/api/v1/admin/stats")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# /admin/me
# ---------------------------------------------------------------------------

def test_admin_me(client, admin_headers):
    r = client.get("/api/v1/admin/me", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["is_admin"] is True
    assert "email" in data


# ---------------------------------------------------------------------------
# /admin/stats
# ---------------------------------------------------------------------------

def test_admin_stats(client, admin_headers):
    r = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    for field in [
        "total_users", "active_users", "admin_users",
        "new_users_today", "new_users_this_week",
        "total_workouts", "total_weight_entries",
        "total_nutrition_logs", "total_photos",
        "total_prs", "total_measurements",
    ]:
        assert field in data
    assert data["total_users"] >= 1
    assert data["admin_users"] >= 1


# ---------------------------------------------------------------------------
# /admin/users
# ---------------------------------------------------------------------------

def test_admin_list_users(client, admin_headers, regular_headers):
    r = client.get("/api/v1/admin/users", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert "users" in data
    assert "total" in data
    assert data["total"] >= 2  # admin + regular


def test_admin_list_users_search(client, admin_headers):
    r = client.get("/api/v1/admin/users?search=super", headers=admin_headers)
    assert r.status_code == 200
    users = r.json()["users"]
    assert all("super" in u["name"].lower() or "super" in u["email"].lower() for u in users)


def test_admin_list_users_filter_admin(client, admin_headers):
    r = client.get("/api/v1/admin/users?is_admin=true", headers=admin_headers)
    assert r.status_code == 200
    assert all(u["is_admin"] for u in r.json()["users"])


def test_admin_list_users_pagination(client, admin_headers):
    r = client.get("/api/v1/admin/users?page=1&per_page=1", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data["users"]) <= 1
    assert data["per_page"] == 1


# ---------------------------------------------------------------------------
# /admin/users/{id}  — detail
# ---------------------------------------------------------------------------

def test_admin_user_detail(client, admin_headers, regular_headers):
    _, user_id = regular_headers
    r = client.get(f"/api/v1/admin/users/{user_id}", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert "user" in data
    assert "stats" in data
    assert "profile" in data
    for stat in ["workouts", "weight_entries", "nutrition_logs", "photos", "personal_records", "measurements"]:
        assert stat in data["stats"]


def test_admin_user_detail_not_found(client, admin_headers):
    r = client.get("/api/v1/admin/users/999999", headers=admin_headers)
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PUT /admin/users/{id}
# ---------------------------------------------------------------------------

def test_admin_update_user(client, admin_headers, regular_headers):
    _, user_id = regular_headers

    # Suspend the user
    r = client.put(
        f"/api/v1/admin/users/{user_id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    # Re-activate
    r2 = client.put(
        f"/api/v1/admin/users/{user_id}",
        json={"is_active": True},
        headers=admin_headers,
    )
    assert r2.status_code == 200
    assert r2.json()["is_active"] is True


def test_admin_grant_and_revoke_admin(client, admin_headers, regular_headers):
    _, user_id = regular_headers

    # Grant admin
    r = client.put(
        f"/api/v1/admin/users/{user_id}",
        json={"is_admin": True},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["is_admin"] is True

    # Revoke admin
    r2 = client.put(
        f"/api/v1/admin/users/{user_id}",
        json={"is_admin": False},
        headers=admin_headers,
    )
    assert r2.status_code == 200
    assert r2.json()["is_admin"] is False


# ---------------------------------------------------------------------------
# POST /admin/users/{id}/reset-password
# ---------------------------------------------------------------------------

def test_admin_reset_password(client, admin_headers, regular_headers):
    _, user_id = regular_headers
    r = client.post(
        f"/api/v1/admin/users/{user_id}/reset-password",
        json={"new_password": "NewSecure123!"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "success"


def test_admin_reset_password_too_short(client, admin_headers, regular_headers):
    _, user_id = regular_headers
    r = client.post(
        f"/api/v1/admin/users/{user_id}/reset-password",
        json={"new_password": "abc"},
        headers=admin_headers,
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# /admin/users/{id}/activity
# ---------------------------------------------------------------------------

def test_admin_user_activity(client, admin_headers, regular_headers):
    _, user_id = regular_headers
    r = client.get(f"/api/v1/admin/users/{user_id}/activity", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert "workouts" in data
    assert "weights" in data
    assert "nutrition" in data


# ---------------------------------------------------------------------------
# /admin/growth
# ---------------------------------------------------------------------------

def test_admin_growth(client, admin_headers):
    r = client.get("/api/v1/admin/growth?days=30", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert "data" in data
    assert data["days"] == 30


# ---------------------------------------------------------------------------
# /admin/activity
# ---------------------------------------------------------------------------

def test_admin_activity(client, admin_headers):
    r = client.get("/api/v1/admin/activity?days=14", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert "data" in data
    assert data["days"] == 14


# ---------------------------------------------------------------------------
# /admin/broadcast
# ---------------------------------------------------------------------------

def test_admin_broadcast_all(client, admin_headers):
    r = client.post(
        "/api/v1/admin/broadcast",
        json={"title": "Test Alert", "message": "Testing broadcast system.", "user_id": None},
        headers=admin_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "sent"
    assert data["recipients"] >= 1
    assert data["title"] == "Test Alert"


def test_admin_broadcast_missing_fields(client, admin_headers):
    r = client.post(
        "/api/v1/admin/broadcast",
        json={"title": "", "message": ""},
        headers=admin_headers,
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Suspended user cannot log in
# ---------------------------------------------------------------------------

def test_suspended_user_cannot_login(client, admin_headers, regular_headers):
    headers, user_id = regular_headers

    # First confirm /me works before suspension
    r_before = client.get("/api/v1/auth/me", headers=headers)
    assert r_before.status_code == 200

    # Admin suspends the user
    r_suspend = client.put(
        f"/api/v1/admin/users/{user_id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert r_suspend.status_code == 200

    # Suspended user's existing token should now be rejected
    r_blocked = client.get("/api/v1/auth/me", headers=headers)
    assert r_blocked.status_code == 403


# ---------------------------------------------------------------------------
# Admin cannot delete their own account via admin endpoint
# ---------------------------------------------------------------------------

def test_admin_cannot_delete_self(client, admin_headers):
    # Get the admin's own ID
    me = client.get("/api/v1/admin/me", headers=admin_headers)
    admin_id = me.json()["id"]

    r = client.delete(f"/api/v1/admin/users/{admin_id}", headers=admin_headers)
    assert r.status_code == 400
