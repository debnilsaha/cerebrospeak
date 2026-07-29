"""Health check endpoints."""

from fastapi import APIRouter

from app.clients.anthropic_client import get_anthropic_client
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
    """Live provider health. Pings each configured AI provider."""
    settings = get_settings()
    providers: dict[str, str] = {}

    # Anthropic
    if settings.anthropic_api_key:
        try:
            ok = await get_anthropic_client().ping()
            providers["anthropic"] = "ok" if ok else "unreachable"
        except Exception as exc:
            logger.warning("anthropic_health_error", error=str(exc))
            providers["anthropic"] = "error"
    else:
        providers["anthropic"] = "not_configured"

    # Placeholders until wired in later phases.
    providers["deepgram"] = "ok" if settings.deepgram_api_key else "not_configured"
    providers["elevenlabs"] = "ok" if settings.elevenlabs_api_key else "not_configured"

    all_ok = all(v in ("ok", "not_configured") for v in providers.values())
    return {"status": "ok" if all_ok else "degraded", "providers": providers}


@router.post("/health/verify-access")
async def verify_access(payload: dict) -> dict:
    """Check whether a submitted demo password is correct."""
    settings = get_settings()
    if not settings.demo_password:
        return {"valid": True, "gate_enabled": False}
    submitted = str(payload.get("password", ""))
    return {"valid": submitted == settings.demo_password, "gate_enabled": True}
