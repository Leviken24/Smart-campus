"""FastAPI router for Computer Vision image analysis and observation management.

Strictly aligned with docs/api-contracts.md Section 2.4.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status

from app.schemas.observation import (
    AnalyzeImageResponse,
    ObservationItem,
    UpdateObservationPayload,
)
from app.services.vision_service import VisionService, vision_service

logger = logging.getLogger("ecotwin.api.observations")

router = APIRouter(prefix="/observations", tags=["Computer Vision & Observations"])


@router.post(
    "/analyze-image",
    response_model=AnalyzeImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image and run Computer Vision inference",
    description="Accepts an image file, validates content type and size, executes dedicated Computer Vision inference, and creates a review-pending observation.",
)
async def analyze_image(
    file: UploadFile = File(..., description="Binary image file (JPEG, PNG, WebP)"),
    building_id: Optional[str] = Form(None, description="Candidate building ID association"),
    service: VisionService = Depends(lambda: vision_service),
) -> AnalyzeImageResponse:
    """Analyze uploaded campus image for visible sustainability issues."""
    file_bytes = await file.read()
    logger.info("Received image upload '%s' (%d bytes) for building '%s'", file.filename, len(file_bytes), building_id)
    return await service.analyze_and_record(
        file_bytes=file_bytes,
        original_filename=file.filename or "upload.jpg",
        building_id=building_id,
        content_type=file.content_type,
    )


@router.get(
    "",
    response_model=List[ObservationItem],
    status_code=status.HTTP_200_OK,
    summary="List observations",
    description="Retrieve list of campus sustainability observations with optional building, status, and source filters.",
)
def list_observations(
    building_id: Optional[str] = Query(None, description="Filter by building ID"),
    status: Optional[str] = Query(None, description="Filter by status: requires_review, confirmed, dismissed, resolved"),
    source: Optional[str] = Query(None, description="Filter by source: image_analysis, sensor_rule, manual"),
    service: VisionService = Depends(lambda: vision_service),
) -> List[ObservationItem]:
    """List observations matching query filters."""
    return service.get_observations(building_id=building_id, status=status, source=source)


@router.get(
    "/{observation_id}",
    response_model=ObservationItem,
    status_code=status.HTTP_200_OK,
    summary="Get single observation",
    description="Retrieve details for a specific observation by ID.",
)
def get_observation(
    observation_id: str,
    service: VisionService = Depends(lambda: vision_service),
) -> ObservationItem:
    """Retrieve details for a single observation."""
    return service.get_observation_by_id(observation_id)


@router.patch(
    "/{observation_id}",
    response_model=ObservationItem,
    status_code=status.HTTP_200_OK,
    summary="Update observation status",
    description="Review and update observation status (confirmed, dismissed, resolved) and assign or correct building association.",
)
def update_observation(
    observation_id: str,
    payload: UpdateObservationPayload,
    service: VisionService = Depends(lambda: vision_service),
) -> ObservationItem:
    """Update observation review status and reviewer note."""
    return service.update_observation(observation_id, payload)
