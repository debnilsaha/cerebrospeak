"""Tests for Pydantic schema validation."""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    GridPredictionRequest,
    PredictedWord,
    SentenceComposeRequest,
    WordCategory,
)


def test_predicted_word_valid():
    w = PredictedWord(word="apple", category=WordCategory.NOUN)
    assert w.word == "apple"
    assert w.category == WordCategory.NOUN
    assert w.urgent is False


def test_predicted_word_rejects_empty():
    with pytest.raises(ValidationError):
        PredictedWord(word="", category=WordCategory.NOUN)


def test_grid_request_defaults():
    req = GridPredictionRequest()
    assert req.grid_size == 11
    assert req.current_tokens == []


def test_grid_request_size_bounds():
    with pytest.raises(ValidationError):
        GridPredictionRequest(grid_size=99)  # exceeds max of 20
    with pytest.raises(ValidationError):
        GridPredictionRequest(grid_size=2)  # below min of 4


def test_sentence_request_requires_tokens():
    with pytest.raises(ValidationError):
        SentenceComposeRequest(tokens=[])  # min_length=1
    ok = SentenceComposeRequest(tokens=["I", "want"])
    assert ok.tokens == ["I", "want"]