"""Prediction service — turns context into a validated grid of predicted words.

Orchestrates: build prompt -> call Anthropic (structured tool use) -> validate
with Pydantic -> return typed words. On any failure, returns a safe core-vocab
fallback grid so the child always has something to communicate with.
"""

import time

from pydantic import ValidationError as PydanticValidationError

from app.clients.anthropic_client import FAST_MODEL, get_anthropic_client
from app.core.logging import get_logger
from app.models.schemas import (
    GridPredictionRequest,
    GridPredictionResponse,
    PredictedWord,
    WordCategory,
)
from app.prompts import grid_prediction as prompt
from app.services import memory_service

logger = get_logger(__name__)

# Safe fallback grid — always available, never depends on the AI.
CORE_FALLBACK: list[PredictedWord] = [
    PredictedWord(word="I", category=WordCategory.PRONOUN),
    PredictedWord(word="want", category=WordCategory.VERB),
    PredictedWord(word="yes", category=WordCategory.SOCIAL),
    PredictedWord(word="no", category=WordCategory.SOCIAL),
    PredictedWord(word="more", category=WordCategory.ADJECTIVE),
    PredictedWord(word="stop", category=WordCategory.VERB, urgent=True),
    PredictedWord(word="help", category=WordCategory.URGENT, urgent=True),
    PredictedWord(word="eat", category=WordCategory.VERB),
    PredictedWord(word="drink", category=WordCategory.VERB),
    PredictedWord(word="go", category=WordCategory.VERB),
    PredictedWord(word="like", category=WordCategory.VERB),
    PredictedWord(word="feel", category=WordCategory.VERB),
]


def _fallback_grid(grid_size: int) -> list[PredictedWord]:
    """Return a ranked slice of the core fallback vocabulary."""
    words = CORE_FALLBACK[:grid_size]
    return [w.model_copy(update={"rank": i + 1}) for i, w in enumerate(words)]


async def predict_grid(req: GridPredictionRequest) -> GridPredictionResponse:
    """Predict the next grid of words for the child."""
    start = time.perf_counter()
    client = get_anthropic_client()

    system_prompt = prompt.build_system_prompt()
    known_facts = await memory_service.get_facts_for_prompt()
    user_prompt = prompt.build_user_prompt(req, known_facts=known_facts)
    tool_schema = prompt.build_tool_schema(req.grid_size)

    try:
        raw = await client.complete_structured(
            system=system_prompt,
            user=user_prompt,
            tool_name="return_grid",
            tool_description="Return the predicted words for the child's grid.",
            input_schema=tool_schema,
            model=FAST_MODEL,
            max_tokens=768,
            temperature=0.0,
        )

        # Validate and normalize each predicted word.
        words: list[PredictedWord] = []
        for i, item in enumerate(raw.get("words", [])):
            try:
                pw = PredictedWord(
                    word=str(item.get("word", "")).strip(),
                    category=item.get("category", "social"),
                    urgent=bool(item.get("urgent", False)),
                    rank=i + 1,
                )
                if pw.word:
                    words.append(pw)
            except PydanticValidationError:
                logger.warning("grid_word_invalid", item=item, prompt_version=prompt.PROMPT_VERSION)
                continue

        if not words:
            raise ValueError("No valid words returned by the model.")

        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "grid_predicted",
            count=len(words),
            latency_ms=latency_ms,
            prompt_version=prompt.PROMPT_VERSION,
        )
        return GridPredictionResponse(
            symbols=words[: req.grid_size], model=FAST_MODEL, latency_ms=latency_ms
        )

    except Exception as exc:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.error(
            "grid_prediction_fallback",
            error_type=type(exc).__name__,
            error=str(exc),
            latency_ms=latency_ms,
            exc_info=exc,
        )
        return GridPredictionResponse(
            symbols=_fallback_grid(req.grid_size),
            model="fallback",
            latency_ms=latency_ms,
        )

    
# ─────────────────────────── Quick replies ───────────────────────────
from app.models.schemas import QuickRepliesRequest, QuickRepliesResponse  # noqa: E402
from app.prompts import quick_replies as qr_prompt  # noqa: E402

_QUICK_REPLY_FALLBACK = ["Yes, please.", "No, thank you.", "I don't know."]


async def quick_replies(req: QuickRepliesRequest) -> QuickRepliesResponse:
    """Generate 3 ready-made replies to the caregiver's utterance."""
    start = time.perf_counter()
    client = get_anthropic_client()

    try:
        raw = await client.complete_structured(
            system=qr_prompt.build_system_prompt(),
            user=qr_prompt.build_user_prompt(req.caregiver_utterance),
            tool_name="return_replies",
            tool_description="Return 3 ready-to-speak replies for the child.",
            input_schema=qr_prompt.build_tool_schema(),
            model=FAST_MODEL,
            max_tokens=256,
            temperature=0.7,
        )
        replies = [str(r).strip() for r in raw.get("replies", []) if str(r).strip()]
        if not replies:
            raise ValueError("No replies returned.")
        model = FAST_MODEL
    except Exception as exc:
        logger.error(
            "quick_replies_fallback",
            error_type=type(exc).__name__,
            error=str(exc),
            exc_info=exc,
        )
        replies = _QUICK_REPLY_FALLBACK
        model = "fallback"

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "quick_replies_generated",
        count=len(replies),
        latency_ms=latency_ms,
        prompt_version=qr_prompt.PROMPT_VERSION,
        model=model,
    )
    return QuickRepliesResponse(replies=replies[:3], model=model, latency_ms=latency_ms)


# ─────────────────────────── Word finder (Say Anything) ───────────────────────────
from app.models.schemas import FindWordsRequest, FindWordsResponse  # noqa: E402
from app.prompts import word_finder as wf_prompt  # noqa: E402


async def find_words(req: FindWordsRequest) -> FindWordsResponse:
    """Find word-cells matching the child's hint/category."""
    start = time.perf_counter()
    client = get_anthropic_client()

    try:
        raw = await client.complete_structured(
            system=wf_prompt.build_system_prompt(),
            user=wf_prompt.build_user_prompt(
                req.query, req.caregiver_utterance, req.grid_size
            ),
            tool_name="return_words",
            tool_description="Return the matching words for the child.",
            input_schema=wf_prompt.build_tool_schema(req.grid_size),
            model=FAST_MODEL,
            max_tokens=768,
            temperature=0.0,
        )
        words: list[PredictedWord] = []
        for i, item in enumerate(raw.get("words", [])):
            try:
                pw = PredictedWord(
                    word=str(item.get("word", "")).strip(),
                    category=item.get("category", "noun"),
                    urgent=bool(item.get("urgent", False)),
                    rank=i + 1,
                )
                if pw.word:
                    words.append(pw)
            except PydanticValidationError:
                continue
        if not words:
            raise ValueError("No matching words returned.")
        model = FAST_MODEL
    except Exception as exc:
        logger.error(
            "find_words_failed",
            error_type=type(exc).__name__,
            error=str(exc),
            exc_info=exc,
        )
        words = _fallback_grid(req.grid_size)
        model = "fallback"

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "words_found",
        query=req.query,
        count=len(words),
        latency_ms=latency_ms,
        prompt_version=wf_prompt.PROMPT_VERSION,
        model=model,
    )
    return FindWordsResponse(symbols=words[: req.grid_size], model=model, latency_ms=latency_ms)