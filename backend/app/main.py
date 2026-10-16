"""FastAPI application entry point for EcoTwin AI backend.

Sets up application lifecycle, CORS middleware, global exception handling,
and mounts foundational API routers.
"""

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.ai import router as ai_router
from app.api.observations import router as observations_router
from app.services.vision_service import UPLOADS_DIR
from app.core.config import settings
from app.core.errors import setup_exception_handlers
from app.db.session import check_database_connection

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ecotwin.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager handling startup and shutdown events."""
    logger.info("Starting EcoTwin AI backend service (Environment: %s)...", settings.APP_ENV)
    
    # Verify database connectivity during startup
    if check_database_connection():
        logger.info("Database connection successfully verified (%s).", settings.DATABASE_URL)
    else:
        logger.warning("Database connection failed during startup (%s).", settings.DATABASE_URL)

    # Provider configuration status logging (no secret exposure)
    logger.info("xAI Grok Provider Configured: %s", settings.is_grok_configured)
    logger.info("Computer Vision Provider: %s (Configured: %s)", settings.VISION_PROVIDER, settings.is_vision_configured)

    yield

    logger.info("Shutting down EcoTwin AI backend service.")


# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Sustainable Campus Intelligence Digital Twin API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials="*" not in settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
setup_exception_handlers(app)

# Mount API routers
app.include_router(health_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(observations_router, prefix="/api")

# Mount Static File Serving for Uploaded Imagery
app.mount("/api/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="api_static_uploads")
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="static_uploads")


@app.get("/", tags=["Root"])
def root_status() -> dict:
    """Root metadata endpoint."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/api/health",
        "status": "online",
    }
