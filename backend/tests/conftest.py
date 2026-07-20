"""Shared pytest fixtures for the test suite."""

import os

# Use an in-memory / temp database for tests, never the real one.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test_cerebrospeak.db")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")
os.environ.setdefault("DEEPGRAM_API_KEY", "test-key")
os.environ.setdefault("ELEVENLABS_API_KEY", "test-key")
os.environ.setdefault("ELEVENLABS_VOICE_ID", "test-voice")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db.database import engine
from sqlmodel import SQLModel


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create fresh tables before each test, drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """An async HTTP client wired to the app (no real network)."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac