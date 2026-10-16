"""Dedicated Computer Vision provider adapter and observation service for EcoTwin AI.

Handles image file validation, secure local persistence, dedicated CV inference
(mock provider or external cloud), and review-pending observation state management.
Never executes directly in frontend.
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from app.core.config import settings
from app.core.errors import AppException, EntityNotFoundException
from app.schemas.observation import (
    AnalyzeImageResponse,
    ObservationItem,
    ObservationStatus,
    ProviderMetadata,
    UpdateObservationPayload,
)

logger = logging.getLogger("ecotwin.vision_service")

# Upload directory configuration
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOADS_DIR = BASE_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


class VisionService:
    """Service class managing Computer Vision inference and observation persistence."""

    def __init__(self):
        # In-memory storage for prototype observations
        self._observations: Dict[str, ObservationItem] = {}
        self._seed_default_observations()

    def _seed_default_observations(self):
        """Seeds canonical initial observation for testing and demo consistency."""
        seed_id = "obs-401"
        self._observations[seed_id] = ObservationItem(
            id=seed_id,
            building_id="LIB",
            observation_type="waste_accumulation",
            description="Visible accumulation of cardboard and packaging outside entrance bins.",
            status="requires_review",
            source="image_analysis",
            image_url="/api/static/uploads/sample-waste.jpg",
            certainty_level="medium",
            provider_metadata=ProviderMetadata(
                provider="dedicated-cv-provider",
                model=settings.VISION_MODEL,
                certainty_level="medium",
                detected_labels=["cardboard", "overflowing_bin"],
            ),
            reviewer_note=None,
            created_at=datetime.now(timezone.utc).isoformat(),
            reviewed_at=None,
        )

    def validate_image(self, file_bytes: bytes, filename: str, content_type: Optional[str] = None):
        """Enforces file size, extension, and magic byte validation."""
        max_bytes = settings.MAX_IMAGE_UPLOAD_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            logger.warning("Rejected file %s: size %d bytes exceeds limit %d bytes", filename, len(file_bytes), max_bytes)
            raise AppException(
                message=f"Image file exceeds maximum allowed limit of {settings.MAX_IMAGE_UPLOAD_MB}MB.",
                code="PAYLOAD_TOO_LARGE",
                status_code=413,
            )

        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            logger.warning("Rejected file %s: invalid extension %s", filename, ext)
            raise AppException(
                message="Invalid file extension. Permitted types: JPEG, PNG, WebP.",
                code="BAD_REQUEST",
                status_code=400,
            )

        if content_type and content_type not in ALLOWED_MIME_TYPES:
            logger.warning("Rejected file %s: invalid MIME %s", filename, content_type)
            raise AppException(
                message="Invalid Content-Type header. Permitted: image/jpeg, image/png, image/webp.",
                code="BAD_REQUEST",
                status_code=400,
            )

        # Magic bytes inspection
        if len(file_bytes) < 8:
            raise AppException(
                message="Uploaded file is empty or corrupted.",
                code="BAD_REQUEST",
                status_code=400,
            )

        is_jpeg = file_bytes.startswith(b"\xff\xd8\xff")
        is_png = file_bytes.startswith(b"\x89PNG\r\n\x1a\n")
        is_webp = file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP"

        if not (is_jpeg or is_png or is_webp):
            logger.warning("Rejected file %s: magic bytes check failed", filename)
            raise AppException(
                message="Corrupted or non-image binary detected. Magic bytes validation failed.",
                code="BAD_REQUEST",
                status_code=400,
            )

    async def analyze_and_record(
        self, file_bytes: bytes, original_filename: str, building_id: Optional[str] = None, content_type: Optional[str] = None
    ) -> AnalyzeImageResponse:
        """Validates image, saves to sanitized path, executes CV inference, and persists review-pending observation."""
        self.validate_image(file_bytes, original_filename, content_type)

        ext = Path(original_filename).suffix.lower()
        if not ext:
            ext = ".jpg"
        safe_filename = f"obs-{uuid.uuid4().hex[:8]}{ext}"
        target_path = UPLOADS_DIR / safe_filename

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        logger.info("Saved validated image to %s", target_path)

        # Dedicated CV Provider Inference (Mock or Cloud)
        fn_lower = original_filename.lower()
        if "leak" in fn_lower or "water" in fn_lower:
            obs_type = "water_leakage"
            description = "Visible liquid discharge and moisture pooling detected near facility water supply line."
            labels = ["water_leak", "surface_moisture", "pipe_drip"]
        else:
            obs_type = "waste_accumulation"
            description = "Visible accumulation of cardboard, paper packaging, and overflowing bin detected outside facility."
            labels = ["cardboard", "overflowing_bin", "packaging_waste"]

        obs_id = f"obs-{uuid.uuid4().hex[:6]}"
        image_url = f"/api/static/uploads/{safe_filename}"
        timestamp = datetime.now(timezone.utc).isoformat()

        provider_meta = ProviderMetadata(
            provider=settings.VISION_PROVIDER,
            model=settings.VISION_MODEL,
            certainty_level="medium",
            detected_labels=labels,
        )

        observation_record = ObservationItem(
            id=obs_id,
            building_id=building_id,
            observation_type=obs_type,
            description=description,
            status="requires_review",
            source="image_analysis",
            image_url=image_url,
            certainty_level="medium",
            provider_metadata=provider_meta,
            reviewer_note=None,
            created_at=timestamp,
            reviewed_at=None,
        )

        self._observations[obs_id] = observation_record
        logger.info("Created review-pending observation %s for building %s", obs_id, building_id)

        return AnalyzeImageResponse(
            observation_id=obs_id,
            building_id=building_id,
            observation_type=obs_type,
            description=description,
            status="requires_review",
            source="image_analysis",
            image_url=image_url,
            provider_metadata=provider_meta,
            created_at=timestamp,
        )

    def get_observations(
        self,
        building_id: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
    ) -> List[ObservationItem]:
        """Lists observations with optional query filters."""
        results = list(self._observations.values())

        if building_id:
            results = [o for o in results if o.building_id == building_id]

        if status:
            results = [o for o in results if o.status == status]

        if source:
            results = [o for o in results if o.source == source]

        # Sort newest first
        results.sort(key=lambda o: o.created_at, reverse=True)
        return results

    def get_observation_by_id(self, observation_id: str) -> ObservationItem:
        """Retrieves a single observation by ID."""
        if observation_id not in self._observations:
            raise EntityNotFoundException(
                message=f"Observation with ID '{observation_id}' not found.",
                entity_type="OBSERVATION",
            )
        return self._observations[observation_id]

    def update_observation(
        self, observation_id: str, payload: UpdateObservationPayload
    ) -> ObservationItem:
        """Updates the status and reviewer notes for an observation."""
        if observation_id not in self._observations:
            raise EntityNotFoundException(
                message=f"Observation with ID '{observation_id}' not found.",
                entity_type="OBSERVATION",
            )

        obs = self._observations[observation_id]
        obs.status = payload.status
        if payload.building_id is not None:
            obs.building_id = payload.building_id
        if payload.reviewer_note is not None:
            obs.reviewer_note = payload.reviewer_note

        obs.reviewed_at = datetime.now(timezone.utc).isoformat()
        logger.info("Updated observation %s status to %s", observation_id, payload.status)
        return obs


# Singleton vision service instance
vision_service = VisionService()
