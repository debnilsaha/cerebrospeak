"""Sentence service — composes tapped keywords into a natural sentence."""

import time

from app.clients.anthropic_client import FAST_MODEL, get_anthropic_client
from app.core.logging import get_logger
from app.models.schemas import SentenceComposeRequest, SentenceComposeResponse
from app.prompts import sentence_composition as prompt

logger = get_logger(__name__)


async def compose_sentence(req: SentenceComposeRequest) -> SentenceComposeResponse:
    """Turn the child's selected keywords into a first-person sentence."""
    start = time.perf_counter()
    client = get_anthropic_client()

    try:
        sentence = await client.complete_text(
            system=prompt.build_system_prompt(),
            user=prompt.build_user_prompt(req),
            model=FAST_MODEL,
            max_tokens=80,
            temperature=0.0,
        )
        sentence = sentence.strip().strip('"').strip()
        if not sentence:
            raise ValueError("Empty sentence returned.")
        model = FAST_MODEL
    except Exception as exc:
        logger.error(
            "sentence_compose_fallback",
            error_type=type(exc).__name__,
            error=str(exc),
            exc_info=exc,
        )
        # Fallback: just join the tokens so the child still gets output.
        sentence = " ".join(req.tokens)
        model = "fallback"

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "sentence_composed",
        latency_ms=latency_ms,
        prompt_version=prompt.PROMPT_VERSION,
        model=model,
    )
    return SentenceComposeResponse(sentence=sentence, model=model, latency_ms=latency_ms)