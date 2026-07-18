"""Application configuration.

Loads and validates all settings from environment variables (and the .env file).
The app refuses to start if a required setting is missing or malformed, so
misconfiguration surfaces immediately with a clear message instead of failing
deep inside a request later.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All application settings, loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ───
    app_name: str = "CerebroSpeak Engine"
    environment: str = Field(default="development")
    log_level: str = Field(default="INFO")

    # ─── CORS ───
    # Comma-separated list of allowed frontend origins.
    cors_origins: str = Field(default="http://localhost:5173")

    # ─── Database ───
    database_url: str = Field(default="sqlite+aiosqlite:///./cerebrospeak.db")

    # ─── AI Provider API Keys ───
    # Optional for now (Phase 1). We wire these in as we build each service,
    # and each client checks for its own key at call time.
    anthropic_api_key: str = Field(default="")
    deepgram_api_key: str = Field(default="")
    elevenlabs_api_key: str = Field(default="")
    elevenlabs_voice_id: str = Field(default="")
    embeddings_api_key: str = Field(default="")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS origins into a clean list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (loaded once per process)."""
    return Settings()