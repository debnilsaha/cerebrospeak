"""Memory endpoints — extract facts and view stored memory."""

from fastapi import APIRouter, Request

from app.models.schemas import MemoryExtractRequest, MemoryExtractResponse
from app.services import memory_service

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("/extract", response_model=MemoryExtractResponse)
async def extract(payload: MemoryExtractRequest, request: Request) -> MemoryExtractResponse:
    result = await memory_service.extract_facts(payload)
    result.request_id = getattr(request.state, "request_id", None)
    return result


@router.get("")
async def get_memory() -> dict:
    """Return all currently stored facts (permanent + non-expired temporary)."""
    return memory_service.get_all_facts()