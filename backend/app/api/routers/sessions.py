"""Session endpoints — start, end (with summary)."""

from fastapi import APIRouter, Request

from app.models.schemas import (
    SessionEndRequest,
    SessionStartResponse,
    SessionSummaryResponse,
)
from app.services import session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionStartResponse)
async def start_session() -> SessionStartResponse:
    """Start a new conversation session."""
    return await session_service.start_session()


@router.post("/end", response_model=SessionSummaryResponse)
async def end_session(payload: SessionEndRequest, request: Request) -> SessionSummaryResponse:
    """End a session: persist messages and return a caregiver summary."""
    result = await session_service.end_session(payload.session_id, payload.messages)
    result.request_id = getattr(request.state, "request_id", None)
    return result