"""Tests for the prediction service, with the AI client mocked."""

from unittest.mock import AsyncMock, patch

from app.models.schemas import GridPredictionRequest
from app.services import prediction_service


async def test_predict_grid_processes_ai_response():
    """A well-formed AI response becomes a validated grid."""
    fake_ai_result = {
        "words": [
            {"word": "yes", "category": "social", "urgent": False},
            {"word": "no", "category": "social", "urgent": False},
            {"word": "help", "category": "urgent", "urgent": True},
        ]
    }

    mock_client = AsyncMock()
    mock_client.complete_structured = AsyncMock(return_value=fake_ai_result)

    with patch.object(prediction_service, "get_anthropic_client", return_value=mock_client):
        req = GridPredictionRequest(grid_size=11, caregiver_utterance="Are you okay?")
        # memory_service.get_facts_for_prompt is async and touches the DB; mock it.
        with patch.object(
            prediction_service.memory_service,
            "get_facts_for_prompt",
            AsyncMock(return_value=""),
        ):
            result = await prediction_service.predict_grid(req)

    assert result.model == "claude-haiku-4-5"
    assert len(result.symbols) == 3
    assert result.symbols[0].word == "yes"
    assert result.symbols[2].urgent is True


async def test_predict_grid_falls_back_on_ai_failure():
    """If the AI raises, we return the safe core-vocabulary fallback grid."""
    mock_client = AsyncMock()
    mock_client.complete_structured = AsyncMock(side_effect=RuntimeError("AI down"))

    with patch.object(prediction_service, "get_anthropic_client", return_value=mock_client):
        req = GridPredictionRequest(grid_size=11)
        with patch.object(
            prediction_service.memory_service,
            "get_facts_for_prompt",
            AsyncMock(return_value=""),
        ):
            result = await prediction_service.predict_grid(req)

    # Fallback grid is returned, never empty.
    assert result.model == "fallback"
    assert len(result.symbols) > 0
    # The core vocabulary always includes "help".
    assert any(w.word == "help" for w in result.symbols)


async def test_predict_grid_filters_invalid_category():
    """Words with invalid categories are dropped, not crashed on."""
    fake_ai_result = {
        "words": [
            {"word": "good", "category": "adjective", "urgent": False},
            {"word": "now", "category": "adverb", "urgent": False},  # invalid category
        ]
    }
    mock_client = AsyncMock()
    mock_client.complete_structured = AsyncMock(return_value=fake_ai_result)

    with patch.object(prediction_service, "get_anthropic_client", return_value=mock_client):
        req = GridPredictionRequest(grid_size=11)
        with patch.object(
            prediction_service.memory_service,
            "get_facts_for_prompt",
            AsyncMock(return_value=""),
        ):
            result = await prediction_service.predict_grid(req)

    # Only the valid word survives; the invalid one is filtered.
    words = [w.word for w in result.symbols]
    assert "good" in words
    assert "now" not in words