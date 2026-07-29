"""Prediction endpoints (grid prediction + quick replies + word finder)."""

from fastapi import APIRouter, Depends, Request

from app.api.deps import require_demo_access

from app.core.logging import get_logger
from app.models.schemas import (
    FindWordsRequest,
    FindWordsResponse,
    GridPredictionRequest,
    GridPredictionResponse,
    QuickRepliesRequest,
    QuickRepliesResponse,
)
from app.services import prediction_service

logger = get_logger(__name__)
router = APIRouter(
    prefix="/predict",
    tags=["prediction"],
    dependencies=[Depends(require_demo_access)],
)


@router.post("/grid", response_model=GridPredictionResponse)
async def predict_grid(payload: GridPredictionRequest, request: Request) -> GridPredictionResponse:
    """Predict the next grid of words for the child to choose from."""
    result = await prediction_service.predict_grid(payload)
    result.request_id = getattr(request.state, "request_id", None)
    return result


@router.post("/quick-replies", response_model=QuickRepliesResponse)
async def quick_replies(payload: QuickRepliesRequest, request: Request) -> QuickRepliesResponse:
    """Generate 3 ready-made replies to the caregiver's utterance."""
    result = await prediction_service.quick_replies(payload)
    result.request_id = getattr(request.state, "request_id", None)
    return result


@router.post("/find-words", response_model=FindWordsResponse)
async def find_words(payload: FindWordsRequest, request: Request) -> FindWordsResponse:
    """Find word-cells matching a hint or category (the 'Say Anything' path)."""
    result = await prediction_service.find_words(payload)
    result.request_id = getattr(request.state, "request_id", None)
    return result