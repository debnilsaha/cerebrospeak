"""ElevenLabs client — the text-to-speech 'Voice'.

Converts text into natural MP3 speech audio using the configured voice and the
low-latency Flash v2.5 model. Returns raw MP3 bytes.

Non-retryable errors (auth/payment/bad-request) fail fast; only genuine
transient errors go through the retry policy.
"""

import asyncio

from elevenlabs.client import ElevenLabs
from elevenlabs.core.api_error import ApiError

from app.clients.base import call_with_resilience
from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import get_logger

logger = get_logger(__name__)

PROVIDER = "elevenlabs"
TTS_MODEL = "eleven_flash_v2_5"
OUTPUT_FORMAT = "mp3_44100_128"

# HTTP statuses where retrying cannot help (client/config errors).
_NON_RETRYABLE_STATUSES = {400, 401, 402, 403, 404, 422}


class FatalProviderError(ProviderError):
    """A provider error that must NOT be retried (auth, payment, bad request)."""


class ElevenLabsTTSClient:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.elevenlabs_api_key:
            raise ProviderError("ElevenLabs API key is not configured.")
        if not settings.elevenlabs_voice_id:
            raise ProviderError("ElevenLabs voice ID is not configured.")
        self._client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        self._voice_id = settings.elevenlabs_voice_id

    async def synthesize(self, text: str) -> bytes:
        """Convert text to MP3 audio bytes."""

        async def _do() -> bytes:
            def _convert() -> bytes:
                stream = self._client.text_to_speech.convert(
                    voice_id=self._voice_id,
                    model_id=TTS_MODEL,
                    output_format=OUTPUT_FORMAT,
                    text=text,
                )
                return b"".join(chunk for chunk in stream)

            try:
                audio = await asyncio.to_thread(_convert)
            except ApiError as exc:
                status = getattr(exc, "status_code", None)
                # Fail fast on non-retryable errors so we don't waste retries.
                if status in _NON_RETRYABLE_STATUSES:
                    logger.error(
                        "elevenlabs_fatal_error",
                        status_code=status,
                        detail=str(getattr(exc, "body", exc)),
                    )
                    raise FatalProviderError(
                        "ElevenLabs request rejected (non-retryable).",
                        detail=str(getattr(exc, "body", exc)),
                    ) from exc
                raise ProviderError("ElevenLabs API error", detail=str(exc)) from exc
            except Exception as exc:
                raise ProviderError("ElevenLabs synthesis error", detail=str(exc)) from exc

            if not audio:
                raise ProviderError("ElevenLabs returned empty audio.")
            return audio

        return await call_with_resilience("synthesize", PROVIDER, _do)


_elevenlabs_client: ElevenLabsTTSClient | None = None


def get_elevenlabs_client() -> ElevenLabsTTSClient:
    """Return a lazily-created singleton ElevenLabsTTSClient."""
    global _elevenlabs_client
    if _elevenlabs_client is None:
        _elevenlabs_client = ElevenLabsTTSClient()
    return _elevenlabs_client