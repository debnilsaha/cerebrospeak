"""Health check endpoints."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    """Basic liveness check — confirms the server is up."""
    settings = get_settings()
    logger.info("health_check")
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
    }


@router.get("/health/providers")
async def health_providers() -> dict:
    """Provider health. Placeholder until AI clients are added in later phases."""
    return {
        "status": "ok",
        "providers": {
            "anthropic": "not_configured",
            "deepgram": "not_configured",
            "elevenlabs": "not_configured",
        },
    }