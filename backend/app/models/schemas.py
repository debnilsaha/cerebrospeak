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


# ─────────────────────────── Sentence composition ───────────────────────────
class SentenceComposeRequest(BaseModel):
    """Request to synthesize tapped keywords into a natural sentence."""

    session_id: str | None = None
    tokens: list[str] = Field(..., min_length=1)
    caregiver_utterance: str = Field(default="", max_length=1000)


class SentenceComposeResponse(BaseModel):
    """The composed first-person sentence."""

    sentence: str
    request_id: str | None = None
    model: str = ""
    latency_ms: float = 0.0


# ─────────────────────────── Quick replies ───────────────────────────
class QuickRepliesRequest(BaseModel):
    """Request for ready-made full-sentence replies to the caregiver."""

    session_id: str | None = None
    caregiver_utterance: str = Field(..., min_length=1, max_length=1000)


class QuickRepliesResponse(BaseModel):
    """A short list of ready-made replies the child can tap."""

    replies: list[str]
    request_id: str | None = None
    model: str = ""
    latency_ms: float = 0.0


# ─────────────────────────── Memory extraction ───────────────────────────
class MemoryFactType(str, Enum):
    PERMANENT = "permanent"
    TEMPORARY = "temporary"


class ExtractedFact(BaseModel):
    """A single fact extracted from a conversation turn."""

    key: str = Field(..., min_length=1, max_length=60)
    value: str = Field(..., min_length=1, max_length=200)
    type: MemoryFactType


class MemoryExtractRequest(BaseModel):
    """Request to extract memory facts from a caregiver+child exchange."""

    session_id: str | None = None
    caregiver_text: str = Field(default="", max_length=1000)
    child_text: str = Field(default="", max_length=1000)


class MemoryExtractResponse(BaseModel):
    """The facts extracted (and stored) from the exchange."""

    facts: list[ExtractedFact]
    request_id: str | None = None
    model: str = ""
    latency_ms: float = 0.0


# ─────────────────────────── Speech (STT) ───────────────────────────
class TranscriptionResponse(BaseModel):
    """Result of transcribing caregiver audio."""

    text: str
    request_id: str | None = None
    latency_ms: float = 0.0


# ─────────────────────────── Speech (TTS) ───────────────────────────
class SynthesizeRequest(BaseModel):
    """Request to synthesize text into speech audio."""

    text: str = Field(..., min_length=1, max_length=500)


# ─────────────────────────── Word finder (Say Anything) ───────────────────────────
class FindWordsRequest(BaseModel):
    """Request to find word-cells matching a hint or a category the child wants."""

    session_id: str | None = None
    query: str = Field(..., min_length=1, max_length=100)
    caregiver_utterance: str = Field(default="", max_length=1000)
    grid_size: int = Field(default=12, ge=4, le=20)


class FindWordsResponse(BaseModel):
    """Matching word-cells the child can tap."""

    symbols: list[PredictedWord]
    request_id: str | None = None
    model: str = ""
    latency_ms: float = 0.0