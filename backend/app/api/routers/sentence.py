"""Sentence composition endpoint."""

from fastapi import APIRouter, Depends, Request

from app.api.deps import require_demo_access

from app.models.schemas import SentenceComposeRequest, SentenceComposeResponse
from app.services import sentence_service

router = APIRouter(
    prefix="/sentence", 
    tags=["sentence"], 
    dependencies=[Depends(require_demo_access)],
)


@router.post("/compose", response_model=SentenceComposeResponse)
async def compose(payload: SentenceComposeRequest, request: Request) -> SentenceComposeResponse:
    result = await sentence_service.compose_sentence(payload)
    result.request_id = getattr(request.state, "request_id", None)
    return result