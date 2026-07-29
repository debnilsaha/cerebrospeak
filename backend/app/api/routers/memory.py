"""Memory endpoints — extract facts, view, edit, and delete stored memory."""

from fastapi import APIRouter, Depends, Request

from app.api.deps import require_demo_access

from pydantic import BaseModel

from app.core.exceptions import NotFoundError
from app.models.schemas import MemoryExtractRequest, MemoryExtractResponse
from app.services import memory_service

router = APIRouter(
    prefix="/memory", 
    tags=["memory"],
    dependencies=[Depends(require_demo_access)],
)


class UpdateFactRequest(BaseModel):
    value: str


@router.post("/extract", response_model=MemoryExtractResponse)
async def extract(payload: MemoryExtractRequest, request: Request) -> MemoryExtractResponse:
    result = await memory_service.extract_facts(payload)
    result.request_id = getattr(request.state, "request_id", None)
    return result


@router.get("")
async def get_memory() -> dict:
    """Return all currently stored facts (permanent + non-expired temporary)."""
    return await memory_service.get_all_facts()


@router.delete("/{key}")
async def delete_memory(key: str) -> dict:
    """Delete a memory fact by key."""
    deleted = await memory_service.delete_fact(key)
    if not deleted:
        raise NotFoundError(f"No fact found with key '{key}'.")
    return {"deleted": key}


@router.put("/{key}")
async def update_memory(key: str, payload: UpdateFactRequest) -> dict:
    """Update a memory fact's value."""
    updated = await memory_service.update_fact(key, payload.value)
    if not updated:
        raise NotFoundError(f"No fact found with key '{key}'.")
    return {"updated": key, "value": payload.value}