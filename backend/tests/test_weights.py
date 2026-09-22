from datetime import date, timedelta

def test_weight_crud_and_stats(client, auth_headers):
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=7)).isoformat()

    # Create baseline weight
    res1 = client.post(
        "/api/v1/weights",
        json={"weight": 80.0, "date": yesterday, "notes": "Starting weight"},
        headers=auth_headers
    )
    assert res1.status_code == 201

    # Create current weight
    res2 = client.post(
        "/api/v1/weights",
        json={"weight": 78.5, "date": today, "notes": "Progress check"},
        headers=auth_headers
    )
    assert res2.status_code == 201
    entry_id = res2.json()["id"]

    # Check stats
    stats_res = client.get("/api/v1/weights/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["starting_weight"] == 80.0
    assert stats["current_weight"] == 78.5
    assert stats["total_change"] == -1.5

    # Update entry
    update_res = client.put(
        f"/api/v1/weights/{entry_id}",
        json={"weight": 78.0},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["weight"] == 78.0

    # Delete entry
    del_res = client.delete(f"/api/v1/weights/{entry_id}", headers=auth_headers)
    assert del_res.status_code == 204
