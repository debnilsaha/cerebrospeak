"""Anthropic (Claude) client — the language intelligence 'Brain'.

Two capabilities:
  - complete_text: free-form text output (e.g. sentence composition).
  - complete_structured: forces schema-valid JSON via Claude tool use, so we
    never string-parse model output. The model is required to call a tool whose
    input_schema we define; the tool input IS our validated structured result.

Model tiers (per blueprint):
  - FAST_MODEL  : grid prediction, quick replies, sentence composition.
  - DEEP_MODEL  : memory extraction, summaries (higher reasoning).
"""

from typing import Any

from anthropic import AsyncAnthropic, APIError

from app.clients.base import call_with_resilience
from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import get_logger

logger = get_logger(__name__)

FAST_MODEL = "claude-haiku-4-5"
DEEP_MODEL = "claude-sonnet-4-6"

PROVIDER = "anthropic"


class AnthropicClient:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise ProviderError("Anthropic API key is not configured.")
        self._client = AsyncAnthropic(api_key=settings.anthropic_api_key, timeout=30.0)

    async def complete_text(
        self,
        *,
        system: str,
        user: str,
        model: str = FAST_MODEL,
        max_tokens: int = 256,
        temperature: float = 0.0,
    ) -> str:
        """Return plain text from Claude."""

        async def _do() -> str:
            try:
                resp = await self._client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system,
                    messages=[{"role": "user", "content": user}],
                )
            except APIError as exc:
                raise ProviderError("Anthropic API error", detail=str(exc)) from exc

            parts = [block.text for block in resp.content if block.type == "text"]
            return "".join(parts).strip()

        return await call_with_resilience("complete_text", PROVIDER, _do)

    async def complete_structured(
        self,
        *,
        system: str,
        user: str,
        tool_name: str,
        tool_description: str,
        input_schema: dict[str, Any],
        model: str = FAST_MODEL,
        max_tokens: int = 1024,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        """Return schema-valid structured data via forced tool use.

        The model MUST call the tool named `tool_name`; the tool's input
        (which conforms to `input_schema`) is returned as our result dict.
        """

        async def _do() -> dict[str, Any]:
            try:
                resp = await self._client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system,
                    messages=[{"role": "user", "content": user}],
                    tools=[
                        {
                            "name": tool_name,
                            "description": tool_description,
                            "input_schema": input_schema,
                        }
                    ],
                    tool_choice={"type": "tool", "name": tool_name},
                )
            except APIError as exc:
                raise ProviderError("Anthropic API error", detail=str(exc)) from exc

            for block in resp.content:
                if block.type == "tool_use" and block.name == tool_name:
                    return block.input  # dict conforming to input_schema

            raise ProviderError(
                "Anthropic did not return the expected tool_use block."
            )

        return await call_with_resilience("complete_structured", PROVIDER, _do)

    async def ping(self) -> bool:
        """Lightweight connectivity check for the health endpoint."""
        try:
            await self._client.messages.create(
                model=FAST_MODEL,
                max_tokens=8,
                messages=[{"role": "user", "content": "ping"}],
            )
            return True
        except Exception as exc:
            logger.warning("anthropic_ping_failed", error=str(exc))
            return False


_anthropic_client: AnthropicClient | None = None


def get_anthropic_client() -> AnthropicClient:
    """Return a lazily-created singleton AnthropicClient."""
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AnthropicClient()
    return _anthropic_client