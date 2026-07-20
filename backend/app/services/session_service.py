"""Session service — persists conversations and generates caregiver summaries."""

import time
import uuid
from datetime import datetime, timezone

from sqlmodel import select

from app.clients.anthropic_client import DEEP_MODEL, get_anthropic_client
from app.core.logging import get_logger
from app.db.database import async_session_factory
from app.models.db import Message, Session
from app.models.schemas import (
    MessageIn,
    SessionStartResponse,
    SessionSummaryResponse,
)
from app.prompts import session_summary as prompt

logger = get_logger(__name__)


async def start_session() -> SessionStartResponse:
    """Create a new session record."""
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    async with async_session_factory() as db:
        db.add(Session(id=session_id, started_at=now))
        await db.commit()
    logger.info("session_started", session_id=session_id)
    return SessionStartResponse(session_id=session_id, started_at=now.isoformat())


async def end_session(session_id: str, messages: list[MessageIn]) -> SessionSummaryResponse:
    """Persist messages, generate a caregiver summary, and close the session."""
    start = time.perf_counter()

    # Persist messages.
    async with async_session_factory() as db:
        for m in messages:
            db.add(Message(session_id=session_id, sender=m.sender, text=m.text))
        await db.commit()

    # Build transcript.
    transcript = "\n".join(
        f"{'Caregiver' if m.sender == 'caregiver' else 'Child'}: {m.text}"
        for m in messages
    )

    # Generate summary (deep model).
    summary = ""
    try:
        client = get_anthropic_client()
        summary = await client.complete_text(
            system=prompt.build_system_prompt(),
            user=prompt.build_user_prompt(transcript),
            model=DEEP_MODEL,
            max_tokens=200,
            temperature=0.3,
        )
    except Exception as exc:
        logger.error("session_summary_failed", error=str(exc), exc_info=exc)
        summary = "Summary unavailable for this session."

    # Update the session record.
    async with async_session_factory() as db:
        result = await db.exec(select(Session).where(Session.id == session_id))
        sess = result.first()
        if sess:
            sess.ended_at = datetime.now(timezone.utc)
            sess.summary = summary
            sess.message_count = len(messages)
            db.add(sess)
            await db.commit()

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "session_ended",
        session_id=session_id,
        message_count=len(messages),
        latency_ms=latency_ms,
        prompt_version=prompt.PROMPT_VERSION,
    )
    return SessionSummaryResponse(
        session_id=session_id, summary=summary, message_count=len(messages)
    )


async def list_sessions(limit: int = 50) -> list[dict]:
    """Return recent ended sessions (most recent first)."""
    async with async_session_factory() as db:
        result = await db.exec(
            select(Session).order_by(Session.started_at.desc()).limit(limit)
        )
        sessions = result.all()

    return [
        {
            "id": s.id,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "summary": s.summary,
            "message_count": s.message_count,
        }
        for s in sessions
        if s.summary  # only show sessions that were actually completed
    ]