from datetime import date

def test_user_data_isolation(client, auth_headers):
    # 1. Register a second user (User B)
    res_b = client.post(
        "/api/v1/auth/register",
        json={
            "name": "User B",
            "email": "userb@example.com",
            "password": "PasswordB123!"
        }
    )
    assert res_b.status_code == 201
    headers_b = {"Authorization": f"Bearer {res_b.json()['access_token']}"}

    # 2. User A logs a confidential weight entry
    entry_a = client.post(
        "/api/v1/weights",
        json={"weight": 95.0, "date": date.today().isoformat(), "notes": "Private User A note"},
        headers=auth_headers
    ).json()

    # 3. User B fetches their weight list: MUST NOT contain User A's entry
    b_weights = client.get("/api/v1/weights", headers=headers_b).json()
    assert all(w["id"] != entry_a["id"] for w in b_weights)

    # 4. User B attempts to directly delete User A's entry: MUST return 404
    hack_del = client.delete(f"/api/v1/weights/{entry_a['id']}", headers=headers_b)
    assert hack_del.status_code == 404

    # 5. User B attempts to directly edit User A's entry: MUST return 404
    hack_put = client.put(
        f"/api/v1/weights/{entry_a['id']}",
        json={"weight": 50.0},
        headers=headers_b
    )
    assert hack_put.status_code == 404

def test_unauthorized_endpoints(client):
    # Endpoints must strictly reject unauthenticated calls with 401
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/weights").status_code == 401
    assert client.get("/api/v1/workouts/sessions").status_code == 401
    assert client.get("/api/v1/profile").status_code == 401
    assert client.get("/api/v1/settings/export-data").status_code == 401
