"""Memory service — extracts facts and persists them in the database.

Facts now survive restarts (SQLite). Temporary facts still expire via TTL.
Function signatures match the previous in-memory version so callers are
unchanged.
"""

import time

from sqlmodel import select

from app.clients.anthropic_client import DEEP_MODEL, get_anthropic_client
from app.core.logging import get_logger
from app.db.database import async_session_factory
from app.models.db import MemoryFact
from app.models.schemas import (
    ExtractedFact,
    MemoryExtractRequest,
    MemoryExtractResponse,
    MemoryFactType,
)
from app.prompts import memory_extraction as prompt

logger = get_logger(__name__)

TEMPORARY_TTL_SECONDS = 12 * 60 * 60  # 12 hours


async def _purge_expired() -> None:
    """Delete temporary facts whose TTL has passed."""
    now = time.time()
    async with async_session_factory() as session:
        result = await session.exec(
            select(MemoryFact).where(
                MemoryFact.expires_at.is_not(None), MemoryFact.expires_at <= now
            )
        )
        expired = result.all()
        for fact in expired:
            await session.delete(fact)
        if expired:
            await session.commit()
            logger.info("temporary_facts_expired", count=len(expired))


async def _upsert_fact(key: str, value: str, fact_type: MemoryFactType) -> None:
    """Insert or update a fact by key."""
    expires = (
        time.time() + TEMPORARY_TTL_SECONDS
        if fact_type == MemoryFactType.TEMPORARY
        else None
    )
    async with async_session_factory() as session:
        result = await session.exec(select(MemoryFact).where(MemoryFact.key == key))
        existing = result.first()
        if existing:
            existing.value = value
            existing.fact_type = fact_type.value
            existing.expires_at = expires
            existing.updated_at = __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            )
            session.add(existing)
        else:
            session.add(
                MemoryFact(
                    key=key,
                    value=value,
                    fact_type=fact_type.value,
                    expires_at=expires,
                )
            )
        await session.commit()


async def get_all_facts() -> dict[str, dict[str, str]]:
    """Return current permanent and (non-expired) temporary facts."""
    await _purge_expired()
    async with async_session_factory() as session:
        result = await session.exec(select(MemoryFact))
        facts = result.all()

    permanent = {f.key: f.value for f in facts if f.fact_type == "permanent"}
    temporary = {f.key: f.value for f in facts if f.fact_type == "temporary"}
    return {"permanent": permanent, "temporary": temporary}


async def get_facts_for_prompt() -> str:
    """Return a compact text summary of known facts, for prompt injection."""
    await _purge_expired()
    async with async_session_factory() as session:
        result = await session.exec(select(MemoryFact))
        facts = result.all()

    lines: list[str] = []
    for f in facts:
        suffix = " (recent)" if f.fact_type == "temporary" else ""
        lines.append(f"- {f.key.replace('_', ' ')}: {f.value}{suffix}")
    return "\n".join(lines)


async def extract_facts(req: MemoryExtractRequest) -> MemoryExtractResponse:
    """Extract facts from the exchange and persist them."""
    start = time.perf_counter()
    await _purge_expired()
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
            await _upsert_fact(fact.key, fact.value, fact.type)
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


async def delete_fact(key: str) -> bool:
    """Delete a fact by key. Returns True if something was deleted."""
    async with async_session_factory() as session:
        result = await session.exec(select(MemoryFact).where(MemoryFact.key == key))
        fact = result.first()
        if fact:
            await session.delete(fact)
            await session.commit()
            logger.info("memory_fact_deleted", key=key)
            return True
    return False


async def update_fact(key: str, value: str) -> bool:
    """Update a fact's value by key. Returns True if updated."""
    async with async_session_factory() as session:
        result = await session.exec(select(MemoryFact).where(MemoryFact.key == key))
        fact = result.first()
        if fact:
            fact.value = value
            session.add(fact)
            await session.commit()
            logger.info("memory_fact_updated", key=key)
            return True
    return False