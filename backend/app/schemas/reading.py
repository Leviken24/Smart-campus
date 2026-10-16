"""EcoTwin AI - Sensor Reading Pydantic Schemas
Defines request/response contracts for telemetry ingestion, validation, and retrieval.
"""

import math
from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.sensor import BuildingIdType, MetricType, SourceType, UnitType

QualityStatusType = Literal["GOOD", "SUSPECT_SPIKE", "OUT_OF_BOUNDS", "INTERPOLATED"]


class SensorReadingBase(BaseModel):
    sensor_id: str = Field(..., min_length=1, max_length=64, description="ID of registered sensor")
    building_id: BuildingIdType = Field(..., description="Target campus building")
    metric: MetricType = Field(..., description="Measured metric")
    value: float = Field(..., description="Measured numeric magnitude (must be >= 0.0)")
    unit: UnitType = Field(..., description="Standard engineering unit")
    timestamp: datetime = Field(..., description="Timezone-aware UTC timestamp")
    source: SourceType = Field(..., description="Immutable provenance label (real, manual, simulated)")
    quality_status: QualityStatusType = Field(default="GOOD", description="Telemetry quality flag")

    @field_validator("value", mode="before")
    @classmethod
    def validate_finite_value(cls, v: object) -> float:
        try:
            val = float(v)  # type: ignore
        except (ValueError, TypeError):
            raise ValueError("ERR_INVALID_NUMERIC_VALUE: Value must be a valid number")
        if math.isnan(val):
            raise ValueError("ERR_INVALID_NUMERIC_VALUE: Value cannot be NaN")
        if math.isinf(val):
            raise ValueError("ERR_INVALID_NUMERIC_VALUE: Value cannot be Infinity")
        if val < 0.0:
            raise ValueError("ERR_NEGATIVE_MAGNITUDE: Value cannot be negative")
        return val

    @field_validator("timestamp")
    @classmethod
    def validate_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            # Assume UTC if naive, but ensure it's timezone-aware
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)


class SensorReadingCreate(SensorReadingBase):
    reading_id: Optional[str] = Field(default=None, description="Optional client-assigned UUID")


class SensorReadingRead(SensorReadingBase):
    reading_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SensorReadingBatchCreate(BaseModel):
    readings: list[SensorReadingCreate] = Field(..., min_length=1, description="List of readings to ingest")


class SensorReadingIngestResponse(BaseModel):
    success: bool
    ingested_count: int
    reading_ids: list[str]


class SimulateRequest(BaseModel):
    building_id: Optional[BuildingIdType] = Field(default=None, description="Optional target building or all buildings if omitted")
    duration_hours: int = Field(default=24, ge=1, le=720, description="Duration in hours to simulate (1 to 720)")
    sampling_interval_seconds: int = Field(default=3600, ge=60, le=86400, description="Step frequency in seconds")


class SimulateResponse(BaseModel):
    success: bool
    generated_readings_count: int
    source: Literal["simulated"] = "simulated"
    building_ids: list[str]
    message: str
