"""Base utilities shared by all AI provider clients.

Provides a standard retry policy (exponential backoff + jitter) and timing/logging
helpers so every provider call is resilient and observable in the same way.
"""

import time
from collections.abc import Awaitable, Callable
from typing import TypeVar

from tenacity import (
    AsyncRetrying,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.core.exceptions import ProviderError
from app.core.logging import get_logger

logger = get_logger(__name__)

T = TypeVar("T")


def _is_retryable(exc: BaseException) -> bool:
    """Retry transient ProviderErrors, but never fail-fast fatal ones."""
    # Imported lazily to avoid a circular import at module load time.
    from app.clients.elevenlabs_client import FatalProviderError

    if isinstance(exc, FatalProviderError):
        return False
    return isinstance(exc, ProviderError)


async def call_with_resilience(
    operation: str,
    provider: str,
    func: Callable[[], Awaitable[T]],
    *,
    max_attempts: int = 3,
) -> T:
    """Run an async provider call with retries, backoff, timing, and logging.

    - Retries up to `max_attempts` times on ProviderError with exponential
      backoff + jitter.
    - Logs a paired ai_call_started / ai_call_finished (or _failed) event.
    """
    start = time.perf_counter()
    logger.info("ai_call_started", provider=provider, operation=operation)

    attempt_number = 0
    try:
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential_jitter(initial=0.5, max=8.0),
            retry=retry_if_exception(_is_retryable),
            reraise=True,
        ):
            with attempt:
                attempt_number = attempt.retry_state.attempt_number
                if attempt_number > 1:
                    logger.warning(
                        "ai_call_retry",
                        provider=provider,
                        operation=operation,
                        attempt=attempt_number,
                    )
                result = await func()

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "ai_call_finished",
            provider=provider,
            operation=operation,
            duration_ms=duration_ms,
            attempts=attempt_number,
            success=True,
        )
        return result

    except Exception as exc:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.error(
            "ai_call_failed",
            provider=provider,
            operation=operation,
            duration_ms=duration_ms,
            attempts=attempt_number,
            error_type=type(exc).__name__,
            exc_info=exc,
        )
        if isinstance(exc, ProviderError):
            raise
        raise ProviderError(
            f"{provider} {operation} failed", detail=str(exc)
        ) from exc