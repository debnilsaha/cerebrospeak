"""Speech endpoints — transcription (STT) and synthesis (TTS)."""

from fastapi import APIRouter, File, Request, Response, UploadFile
from fastapi.responses import Response as FastAPIResponse

from app.core.exceptions import NotFoundError
from app.models.schemas import SynthesizeRequest, TranscriptionResponse
from app.services import transcription_service, tts_service

router = APIRouter(prefix="/speech", tags=["speech"])


@router.post("/transcribe", response_model=TranscriptionResponse, operation_id="speech_transcribe")
async def transcribe(
    request: Request, file: UploadFile = File(...)
) -> TranscriptionResponse:
    """Transcribe an uploaded audio file (caregiver speech) to text."""
    audio_bytes = await file.read()
    mimetype = file.content_type or "audio/wav"
    result = await transcription_service.transcribe(audio_bytes, mimetype)
    result.request_id = getattr(request.state, "request_id", None)
    return result


@router.post("/synthesize", operation_id="speech_synthesize")
async def synthesize(payload: SynthesizeRequest, request: Request) -> Response:
    """Synthesize text into speech and return MP3 audio.

    Also exposes the cache key + hit status via response headers so the client
    can reuse the /speech/audio/{key} URL for instant replay.
    """
    audio, cache_hit, key = await tts_service.synthesize(payload.text)
    request_id = getattr(request.state, "request_id", None)
    return FastAPIResponse(
        content=audio,
        media_type="audio/mpeg",
        headers={
            "X-Cache-Hit": str(cache_hit).lower(),
            "X-Audio-Key": key,
            "X-Request-ID": request_id or "",
        },
    )


@router.get("/audio/{key}", operation_id="speech_get_audio")
async def get_audio(key: str) -> Response:
    """Serve previously-synthesized audio by cache key (for instant replay)."""
    audio = tts_service.get_cached_audio(key)
    if audio is None:
        raise NotFoundError("Audio not found for that key.")
    return FastAPIResponse(content=audio, media_type="audio/mpeg")