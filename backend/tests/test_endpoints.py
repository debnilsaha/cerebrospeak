"""Integration tests hitting endpoints through the app, with AI mocked."""

from unittest.mock import AsyncMock, patch

from app.services import prediction_service, session_service


async def test_predict_grid_endpoint(client):
    """POST /predict/grid returns a validated grid."""
    fake_ai_result = {
        "words": [
            {"word": "I", "category": "pronoun", "urgent": False},
            {"word": "want", "category": "verb", "urgent": False},
        ]
    }
    mock_ai = AsyncMock()
    mock_ai.complete_structured = AsyncMock(return_value=fake_ai_result)

    with patch.object(prediction_service, "get_anthropic_client", return_value=mock_ai):
        with patch.object(
            prediction_service.memory_service,
            "get_facts_for_prompt",
            AsyncMock(return_value=""),
        ):
            resp = await client.post(
                "/predict/grid",
                json={
                    "caregiver_utterance": "What do you want?",
                    "current_tokens": [],
                    "exclude_words": [],
                    "time_of_day": "afternoon",
                    "grid_size": 11,
                },
            )

    assert resp.status_code == 200
    data = resp.json()
    assert len(data["symbols"]) == 2
    assert data["symbols"][0]["word"] == "I"
    assert data["request_id"] is not None


async def test_predict_grid_endpoint_validation_error(client):
    """An out-of-range grid_size is rejected by validation."""
    resp = await client.post(
        "/predict/grid",
        json={"grid_size": 999},
    )
    assert resp.status_code == 422  # Unprocessable — schema validation


async def test_session_lifecycle_endpoints(client):
    """POST /sessions then POST /sessions/end works end to end."""
    # Start a session.
    start = await client.post("/sessions")
    assert start.status_code == 200
    session_id = start.json()["session_id"]
    assert session_id

    # End it with a mocked summary.
    mock_ai = AsyncMock()
    mock_ai.complete_text = AsyncMock(return_value="A lovely chat about snacks.")

    with patch.object(session_service, "get_anthropic_client", return_value=mock_ai):
        end = await client.post(
            "/sessions/end",
            json={
                "session_id": session_id,
                "messages": [
                    {"sender": "caregiver", "text": "Hungry?"},
                    {"sender": "child", "text": "Yes, I want a snack."},
                ],
            },
        )

    assert end.status_code == 200
    data = end.json()
    assert data["summary"] == "A lovely chat about snacks."
    assert data["message_count"] == 2


async def test_memory_endpoint_get(client):
    """GET /memory returns the two-tier structure."""
    resp = await client.get("/memory")
    assert resp.status_code == 200
    data = resp.json()
    assert "permanent" in data
    assert "temporary" in data