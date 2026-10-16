"""FastAPI router for Grok AI recommendations and sustainability reporting.

Endpoints:
- POST /api/ai/recommendations: Generates grounded recommendations based on campus context.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, status

from app.schemas.ai import (
    RecommendationRequest,
    RecommendationResponse,
    ReportRequest,
    ReportResponse,
)
from app.services.grok_service import GrokService, grok_service
from app.services.report_service import ReportService, report_service

logger = logging.getLogger("ecotwin.api.ai")

router = APIRouter(prefix="/ai", tags=["Grok AI Intelligence"])


@router.post(
    "/recommendations",
    response_model=List[RecommendationResponse],
    status_code=status.HTTP_200_OK,
    summary="Generate Grok AI recommendations",
    description="Invokes xAI Grok to synthesize grounded, prioritized sustainability recommendations based on verified building context and simulation scenarios.",
)
async def generate_recommendations(
    payload: RecommendationRequest,
    service: GrokService = Depends(lambda: grok_service),
) -> List[RecommendationResponse]:
    """Execute grounded Grok AI reasoning for campus sustainability interventions."""
    logger.info(
        "Received recommendation request for building=%s, scenario=%s",
        payload.building_id,
        payload.scenario_id,
    )
    return await service.get_recommendations(payload)


@router.post(
    "/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate sustainability audit report",
    description="Compiles multi-source telemetry, active observations, deterministic simulations, and Grok synthesis into an executive report.",
)
async def generate_report(
    payload: ReportRequest,
    service: ReportService = Depends(lambda: report_service),
) -> ReportResponse:
    """Generate comprehensive sustainability report document."""
    logger.info(
        "Received report generation request for scope=%s, period=%s",
        payload.scope,
        payload.time_period,
    )
    return await service.generate_report(payload)
