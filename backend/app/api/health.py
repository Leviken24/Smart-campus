"""System health check endpoint implementation."""

from datetime import datetime, timezone
from fastapi import APIRouter, Response, status

from app.core.config import settings
from app.db.session import check_database_connection
from app.schemas.health import HealthProviders, HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Backend Health Check",
    description="Verifies backend liveness, database connectivity, and external provider configuration status.",
    tags=["System Health"],
)
def get_health(response: Response) -> HealthResponse:
    """Verifies backend liveness and database connectivity."""
    db_connected = check_database_connection()
    current_time_iso = datetime.now(timezone.utc).isoformat()

    providers_status = HealthProviders(
        grok_configured=settings.is_grok_configured,
        vision_configured=settings.is_vision_configured,
    )

    if not db_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="unhealthy",
            version=settings.VERSION,
            timestamp=current_time_iso,
            database="disconnected",
            providers=providers_status,
        )

    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        timestamp=current_time_iso,
        database="connected",
        providers=providers_status,
    )
