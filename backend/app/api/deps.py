"""Shared FastAPI dependencies."""

from fastapi import Header, HTTPException, status

from app.core.config import Settings, get_settings


def get_app_settings() -> Settings:
    """Dependency that provides the application settings."""
    return get_settings()


async def require_demo_access(x_demo_password: str | None = Header(default=None)) -> None:
    """Gate AI endpoints behind the shared demo password.

    If no demo_password is configured (e.g. local dev), access is open.
    Otherwise the request must send a matching X-Demo-Password header.
    """
    settings = get_settings()
    if not settings.demo_password:
        return  # gate disabled
    if x_demo_password != settings.demo_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing demo password.",
        )