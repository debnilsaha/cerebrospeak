"""Deepgram client — the speech-to-text 'Ears'.

Batch transcription using Deepgram SDK v7 (nova-3). Takes audio bytes and
returns the transcribed text. (Live streaming is added in a later phase.)
"""

import asyncio

from deepgram import DeepgramClient

from app.clients.base import call_with_resilience
from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import get_logger

logger = get_logger(__name__)

PROVIDER = "deepgram"
STT_MODEL = "nova-3"


class DeepgramSTTClient:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.deepgram_api_key:
            raise ProviderError("Deepgram API key is not configured.")
        self._client = DeepgramClient(api_key=settings.deepgram_api_key)

    async def transcribe(self, audio_bytes: bytes, mimetype: str = "audio/wav") -> str:
        """Transcribe audio bytes to text (SDK v7 API)."""

        async def _do() -> str:
            try:
                # transcribe_file is synchronous; run it off the event loop.
                response = await asyncio.to_thread(
                    self._client.listen.v1.media.transcribe_file,
                    request=audio_bytes,
                    model=STT_MODEL,
                    smart_format=True,
                    punctuate=True,
                    language="en",
                )
            except Exception as exc:
                raise ProviderError("Deepgram transcription error", detail=str(exc)) from exc

            try:
                transcript = response.results.channels[0].alternatives[0].transcript
            except (AttributeError, IndexError, TypeError) as exc:
                raise ProviderError(
                    "Deepgram returned an unexpected response shape.", detail=str(exc)
                ) from exc

            return (transcript or "").strip()

        return await call_with_resilience("transcribe", PROVIDER, _do)

    def ping_configured(self) -> bool:
        """The key is present (constructor would have failed otherwise)."""
        return True


_deepgram_client: DeepgramSTTClient | None = None


def get_deepgram_client() -> DeepgramSTTClient:
    """Return a lazily-created singleton DeepgramSTTClient."""
    global _deepgram_client
    if _deepgram_client is None:
        _deepgram_client = DeepgramSTTClient()
    return _deepgram_client