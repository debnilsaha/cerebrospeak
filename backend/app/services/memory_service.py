"""Memory service — extracts and stores facts about the child.

Phase 4: in-memory store with TTL expiry for temporary facts. Phase 7 will
replace this with persistent SQLite + semantic retrieval.
"""

import time

from app.clients.anthropic_client import DEEP_MODEL, get_anthropic_client
from app.core.logging import get_logger
from app.models.schemas import (
    ExtractedFact,
    MemoryExtractRequest,
    MemoryExtractResponse,
    MemoryFactType,
)
from app.prompts import memory_extraction as prompt

logger = get_logger(__name__)

# Temporary facts expire after this many seconds (12 hours).
TEMPORARY_TTL_SECONDS = 12 * 60 * 60

# In-memory stores (Phase 4). Keyed by fact key.
_permanent_store: dict[str, str] = {
    "likes": "apples, playing with the blue truck",
    "dislikes": "loud noises",
}
_temporary_store: dict[str, dict] = {}  # key -> {"value": str, "expires_at": float}


def _purge_expired() -> None:
    now = time.time()
    expired = [k for k, v in _temporary_store.items() if v["expires_at"] <= now]
    for k in expired:
        del _temporary_store[k]
    if expired:
        logger.info("temporary_facts_expired", count=len(expired), keys=expired)


def get_all_facts() -> dict[str, dict[str, str]]:
    """Return current permanent and (non-expired) temporary facts."""
    _purge_expired()
    return {
        "permanent": dict(_permanent_store),
        "temporary": {k: v["value"] for k, v in _temporary_store.items()},
    }


async def extract_facts(req: MemoryExtractRequest) -> MemoryExtractResponse:
    """Extract facts from the exchange and store them."""
    start = time.perf_counter()
    _purge_expired()
    client = get_anthropic_client()

    facts: list[ExtractedFact] = []
    model = DEEP_MODEL
    try:
        raw = await client.complete_structured(
            system=prompt.build_system_prompt(),
            user=prompt.build_user_prompt(req),
            tool_name="return_facts",
            tool_description="Return the extracted facts about the child.",
            input_schema=prompt.build_tool_schema(),
            model=DEEP_MODEL,
            max_tokens=400,
            temperature=0.0,
        )
        for item in raw.get("facts", []):
            try:
                fact = ExtractedFact(
                    key=str(item["key"]).strip().lower().replace(" ", "_"),
                    value=str(item["value"]).strip(),
                    type=MemoryFactType(item["type"]),
                )
            except Exception:
                continue

            facts.append(fact)
            if fact.type == MemoryFactType.PERMANENT:
                _permanent_store[fact.key] = fact.value
            else:
                _temporary_store[fact.key] = {
                    "value": fact.value,
                    "expires_at": time.time() + TEMPORARY_TTL_SECONDS,
                }
    except Exception as exc:
        logger.error(
            "memory_extract_failed",
            error_type=type(exc).__name__,
            error=str(exc),
            exc_info=exc,
        )
        model = "fallback"

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "memory_extracted",
        count=len(facts),
        latency_ms=latency_ms,
        prompt_version=prompt.PROMPT_VERSION,
        model=model,
    )
    return MemoryExtractResponse(facts=facts, model=model, latency_ms=latency_ms)