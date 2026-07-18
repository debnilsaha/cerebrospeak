"""Application exception hierarchy and global exception handlers.

Every error becomes a consistent JSON response and is logged with the request's
correlation ID, so a failure the user sees can be matched to a backend log line.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.logging import get_logger

logger = get_logger(__name__)


class AppError(Exception):
    """Base class for all application errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "internal_error"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, *, detail: str | None = None):
        if message:
            self.message = message
        self.detail = detail
        super().__init__(self.message)


class ProviderError(AppError):
    """An upstream AI provider (Anthropic, Deepgram, etc.) failed."""

    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "provider_error"
    message = "An AI provider request failed."


class ValidationError(AppError):
    """The AI returned data that failed our schema validation."""

    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    error_code = "validation_error"
    message = "The AI response failed validation."


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"
    message = "The requested resource was not found."


def _error_response(status_code: int, error_code: str, message: str, request: Request) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": error_code,
                "message": message,
                "request_id": request_id,
            }
        },
        headers={"X-Request-ID": request_id} if request_id else {},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the app."""

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        logger.warning(
            "app_error",
            error_code=exc.error_code,
            message=exc.message,
            detail=exc.detail,
            path=request.url.path,
        )
        return _error_response(exc.status_code, exc.error_code, exc.message, request)

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "unhandled_exception",
            error_type=type(exc).__name__,
            path=request.url.path,
            exc_info=exc,
        )
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "internal_error",
            "An unexpected error occurred.",
            request,
        )