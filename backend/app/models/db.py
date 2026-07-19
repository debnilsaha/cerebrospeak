"""Database table models (SQLModel).

These are the persistent tables. MemoryFact stores what the system has learned
about the child, surviving restarts.
"""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MemoryFact(SQLModel, table=True):
    """A learned fact about the child (permanent or temporary)."""

    __tablename__ = "memory_facts"

    id: int | None = Field(default=None, primary_key=True)
    key: str = Field(index=True)
    value: str
    fact_type: str = Field(default="permanent")  # "permanent" | "temporary"
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    # For temporary facts: when they expire (epoch seconds). None = never.
    expires_at: float | None = Field(default=None)