"""Shared FastAPI dependencies."""

from app.core.config import Settings, get_settings


def get_app_settings() -> Settings:
    """Dependency that provides the application settings."""
    return get_settings()