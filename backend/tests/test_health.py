"""Tests for the health endpoints."""


async def test_health_ok(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "app" in data


async def test_health_has_request_id_header(client):
    resp = await client.get("/health")
    assert "X-Request-ID" in resp.headers