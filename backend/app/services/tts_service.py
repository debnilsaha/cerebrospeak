"""TTS service — synthesizes speech and caches audio by content hash.

Frequent utterances ("Yes", "Help") are served from an on-disk cache instead of
re-calling the API, giving instant replay and lower cost.
"""

import hashlib
import time
from pathlib import Path

from app.clients.elevenlabs_client import TTS_MODEL, get_elevenlabs_client
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

CACHE_DIR = Path("audio_cache")
CACHE_DIR.mkdir(exist_ok=True)


def _cache_key(text: str) -> str:
    settings = get_settings()
    raw = f"{TTS_MODEL}:{settings.elevenlabs_voice_id}:{text}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _cache_path(key: str) -> Path:
    return CACHE_DIR / f"{key}.mp3"


async def synthesize(text: str) -> tuple[bytes, bool, str]:
    """Return (audio_bytes, cache_hit, cache_key) for the given text."""
    start = time.perf_counter()
    text = text.strip()
    key = _cache_key(text)
    path = _cache_path(key)

    # Cache hit
    if path.exists():
        audio = path.read_bytes()
        logger.info("tts_cache_hit", cache_key=key, char_count=len(text))
        return audio, True, key

    # Cache miss -> synthesize and store
    client = get_elevenlabs_client()
    audio = await client.synthesize(text)
    path.write_bytes(audio)

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "tts_synthesized",
        cache_key=key,
        char_count=len(text),
        bytes=len(audio),
        latency_ms=latency_ms,
    )
    return audio, False, key


def get_cached_audio(key: str) -> bytes | None:
    """Return cached audio bytes for a key, or None if not present."""
    path = _cache_path(key)
    if path.exists():
        return path.read_bytes()
    return None