"""Prediction endpoints (grid prediction)."""

from fastapi import APIRouter, Request

from app.core.logging import get_logger
from app.models.schemas import GridPredictionRequest, GridPredictionResponse
from app.services import prediction_service

logger = get_logger(__name__)
router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post("/grid", response_model=GridPredictionResponse)
async def predict_grid(payload: GridPredictionRequest, request: Request) -> GridPredictionResponse:
    """Predict the next grid of words for the child to choose from."""
    result = await prediction_service.predict_grid(payload)
    result.request_id = getattr(request.state, "request_id", None)
    return result