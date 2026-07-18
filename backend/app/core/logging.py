"""Structured logging configuration (structlog).

- Development: pretty, colored console output for easy reading.
- All environments: JSON lines written to rotating files under logs/, so any
  issue can be traced by grepping a single request_id across the log stream.

A bound `request_id` (set by middleware) is automatically attached to every
log line emitted during that request.
"""

import logging
import logging.handlers
from pathlib import Path

import structlog

from app.core.config import get_settings

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

APP_LOG_FILE = LOGS_DIR / "cerebrospeak.jsonl"
ERROR_LOG_FILE = LOGS_DIR / "errors.jsonl"


def configure_logging() -> None:
    """Configure structlog + stdlib logging. Call once at startup."""
    settings = get_settings()
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Processors shared by every log entry, regardless of output sink.
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,  # pulls in bound request_id, etc.
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    # structlog renders through the stdlib logging system so we can use handlers.
    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Console handler: pretty in dev, JSON in production.
    console_handler = logging.StreamHandler()
    if settings.is_development:
        console_renderer = structlog.dev.ConsoleRenderer(colors=True)
    else:
        console_renderer = structlog.processors.JSONRenderer()
    console_handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processor=console_renderer,
        )
    )

    # File handler: all logs as JSON, rotating at 10 MB, keep 5 backups.
    file_handler = logging.handlers.RotatingFileHandler(
        APP_LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processor=structlog.processors.JSONRenderer(),
        )
    )

    # Error file handler: only WARNING and above, as JSON.
    error_handler = logging.handlers.RotatingFileHandler(
        ERROR_LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    error_handler.setLevel(logging.WARNING)
    error_handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processor=structlog.processors.JSONRenderer(),
        )
    )

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)
    root_logger.setLevel(log_level)

    # Quiet down noisy third-party loggers.
    for noisy in ("uvicorn.access", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Return a structlog logger. Use module __name__ as the name."""
    return structlog.get_logger(name)