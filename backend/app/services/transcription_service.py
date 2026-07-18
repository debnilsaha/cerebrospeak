"""Transcription service — converts caregiver audio to text."""

import time

from app.clients.deepgram_client import get_deepgram_client
from app.core.logging import get_logger
from app.models.schemas import TranscriptionResponse

logger = get_logger(__name__)


async def transcribe(audio_bytes: bytes, mimetype: str) -> TranscriptionResponse:
    """Transcribe audio bytes to text."""
    start = time.perf_counter()
    client = get_deepgram_client()

    text = await client.transcribe(audio_bytes, mimetype=mimetype)

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "audio_transcribed",
        char_count=len(text),
        latency_ms=latency_ms,
    )
    return TranscriptionResponse(text=text, latency_ms=latency_ms)