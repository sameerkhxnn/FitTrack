def test_register_and_login(client):
    # 1. Register new user
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Jane Lifter",
            "email": "jane@example.com",
            "password": "SecretPassword123",
            "height": 168.0,
            "gender": "female"
        }
    )
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane@example.com"

    # 2. Duplicate registration should fail
    dup_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Jane Duplicate",
            "email": "jane@example.com",
            "password": "AnotherPassword123"
        }
    )
    assert dup_res.status_code == 400

    # 3. Login with correct credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "jane@example.com",
            "password": "SecretPassword123"
        }
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login with incorrect password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "jane@example.com",
            "password": "WrongPassword"
        }
    )
    assert bad_login.status_code == 401

def test_current_user_me(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "athlete@example.com"
