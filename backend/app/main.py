"""Application factory and entrypoint.

create_app() wires together configuration, logging, middleware, CORS,
exception handlers, and routers. Import target for uvicorn: app.main:app
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import health, memory, prediction, sentence, speech
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.middleware import RequestContextMiddleware

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("app_starting", app=settings.app_name, environment=settings.environment)
    from app.db.database import init_db

    await init_db()
    yield
    logger.info("app_shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="2.0.0",
        lifespan=lifespan,
    )

    # Request-ID / logging middleware (added first so it wraps everything).
    app.add_middleware(RequestContextMiddleware)

    # CORS — only the configured frontend origins.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # Global exception handlers.
    register_exception_handlers(app)

    # Routers.
    app.include_router(health.router)
    app.include_router(prediction.router)
    app.include_router(sentence.router)
    app.include_router(memory.router)
    app.include_router(speech.router)

    logger.info("app_configured", cors_origins=settings.cors_origins_list)
    return app


app = create_app()