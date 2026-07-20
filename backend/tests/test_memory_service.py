"""Tests for the memory service, with the AI client mocked."""

from unittest.mock import AsyncMock, patch

from app.models.schemas import MemoryExtractRequest
from app.services import memory_service


async def test_extract_and_store_facts():
    """Extracted facts are persisted and retrievable."""
    fake_ai_result = {
        "facts": [
            {"key": "favorite_food", "value": "pizza", "type": "permanent"},
            {"key": "current_mood", "value": "happy", "type": "temporary"},
        ]
    }
    mock_client = AsyncMock()
    mock_client.complete_structured = AsyncMock(return_value=fake_ai_result)

    with patch.object(memory_service, "get_anthropic_client", return_value=mock_client):
        req = MemoryExtractRequest(
            caregiver_text="What do you like to eat?",
            child_text="I love pizza!",
        )
        result = await memory_service.extract_facts(req)

    assert len(result.facts) == 2

    # Verify persistence.
    all_facts = await memory_service.get_all_facts()
    assert all_facts["permanent"].get("favorite_food") == "pizza"
    assert all_facts["temporary"].get("current_mood") == "happy"


async def test_delete_fact():
    """A stored fact can be deleted."""
    fake_ai_result = {
        "facts": [{"key": "favorite_color", "value": "blue", "type": "permanent"}]
    }
    mock_client = AsyncMock()
    mock_client.complete_structured = AsyncMock(return_value=fake_ai_result)

    with patch.object(memory_service, "get_anthropic_client", return_value=mock_client):
        await memory_service.extract_facts(
            MemoryExtractRequest(caregiver_text="color?", child_text="blue")
        )

    assert (await memory_service.get_all_facts())["permanent"].get("favorite_color") == "blue"

    deleted = await memory_service.delete_fact("favorite_color")
    assert deleted is True
    assert "favorite_color" not in (await memory_service.get_all_facts())["permanent"]


async def test_facts_for_prompt_format():
    """The prompt-injection format includes stored facts."""
    fake_ai_result = {
        "facts": [{"key": "likes", "value": "trains", "type": "permanent"}]
    }
    mock_client = AsyncMock()
    mock_client.complete_structured = AsyncMock(return_value=fake_ai_result)

    with patch.object(memory_service, "get_anthropic_client", return_value=mock_client):
        await memory_service.extract_facts(
            MemoryExtractRequest(caregiver_text="?", child_text="trains")
        )

    prompt_text = await memory_service.get_facts_for_prompt()
    assert "trains" in prompt_text