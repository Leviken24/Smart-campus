"""Pydantic schemas for Computer Vision and observations.

Strictly aligned with docs/api-contracts.md Section 2.4.
"""

from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

ObservationStatus = Literal["requires_review", "confirmed", "dismissed", "resolved"]
ObservationSource = Literal["image_analysis", "sensor_rule", "manual"]
ObservationType = Literal["waste_accumulation", "water_leakage", "energy_waste", "other"]
CertaintyLevel = Literal["low", "medium", "high"]


class ProviderMetadata(BaseModel):
    """Metadata from the dedicated Computer Vision inference provider."""

    provider: str = Field(..., description="Provider identifier, e.g. mock, roboflow, huggingface")
    model: str = Field(..., description="Vision model identifier")
    certainty_level: CertaintyLevel = Field(..., description="Qualitative confidence assessment")
    detected_labels: List[str] = Field(default_factory=list, description="Labels detected in image")


class AnalyzeImageResponse(BaseModel):
    """Response returned upon uploading an image and running CV inference."""

    observation_id: str = Field(..., description="Unique observation ID, e.g. obs-401")
    building_id: Optional[str] = Field(None, description="Candidate building ID, e.g. LIB")
    observation_type: str = Field(..., description="Category, e.g. waste_accumulation, water_leakage")
    description: str = Field(..., description="Natural language description of observation")
    status: ObservationStatus = Field(default="requires_review", description="Initial review status")
    source: str = Field(default="image_analysis", description="Data provenance source")
    image_url: str = Field(..., description="Sanitized relative serving path for uploaded image")
    provider_metadata: ProviderMetadata = Field(..., description="Dedicated CV provider output metadata")
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 creation timestamp with timezone",
    )


class ObservationItem(BaseModel):
    """Observation item model returned when listing observations."""

    id: str = Field(..., description="Unique observation identifier")
    building_id: Optional[str] = Field(None, description="Associated building ID")
    observation_type: str = Field(..., description="Observation category")
    description: str = Field(..., description="Description of detected issue")
    status: ObservationStatus = Field(..., description="Current status in observation lifecycle")
    source: str = Field(..., description="Source of observation")
    image_url: Optional[str] = Field(None, description="Serving URL of image evidence")
    certainty_level: Optional[CertaintyLevel] = Field(None, description="Certainty level")
    provider_metadata: Optional[ProviderMetadata] = Field(None, description="Vision metadata")
    reviewer_note: Optional[str] = Field(None, description="Human reviewer notes")
    created_at: str = Field(..., description="Creation timestamp")
    reviewed_at: Optional[str] = Field(None, description="Review timestamp")


class UpdateObservationPayload(BaseModel):
    """Payload for updating an observation's review status."""

    status: ObservationStatus = Field(..., description="New status: confirmed, dismissed, resolved, or requires_review")
    building_id: Optional[str] = Field(None, description="Confirmed or corrected building location")
    reviewer_note: Optional[str] = Field(None, description="Audited operator note")
