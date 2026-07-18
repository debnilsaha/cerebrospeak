"""Pydantic schemas — the single source of truth for all API data shapes.

Request and response models are validated on the way in and on the way out,
so a malformed shape can never silently propagate through the system.
"""

from enum import Enum

from pydantic import BaseModel, Field


# ─────────────────────────── Shared enums ───────────────────────────
class WordCategory(str, Enum):
    """Fitzgerald Key categories for AAC color coding."""

    PRONOUN = "pronoun"
    VERB = "verb"
    NOUN = "noun"
    ADJECTIVE = "adjective"
    SOCIAL = "social"
    QUESTION = "question"
    URGENT = "urgent"


# ─────────────────────────── Grid prediction ───────────────────────────
class PredictedWord(BaseModel):
    """A single predicted word cell in the grid."""

    word: str = Field(..., min_length=1, max_length=40)
    category: WordCategory
    urgent: bool = False
    rank: int = Field(default=0, ge=0)
    reason: str = Field(default="", max_length=120)


class GridPredictionRequest(BaseModel):
    """Request to predict the next set of grid words."""

    session_id: str | None = None
    current_tokens: list[str] = Field(default_factory=list)
    caregiver_utterance: str = Field(default="", max_length=1000)
    exclude_words: list[str] = Field(default_factory=list)
    time_of_day: str = Field(default="", max_length=20)
    grid_size: int = Field(default=11, ge=4, le=20)


class GridPredictionResponse(BaseModel):
    """Response containing the predicted grid words."""

    symbols: list[PredictedWord]
    request_id: str | None = None
    model: str = ""
    latency_ms: float = 0.0