"""Async database engine and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

settings = get_settings()

# echo=False keeps SQL out of logs; our structured logs cover what we need.
engine = create_async_engine(settings.database_url, echo=False, future=True)

async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db() -> None:
    """Create all tables if they don't exist. Called at startup."""
    # Import models so they're registered on SQLModel.metadata before create_all.
    from app.models import db as _models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("database_initialized", url=settings.database_url)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session."""
    async with async_session_factory() as session:
        yield session