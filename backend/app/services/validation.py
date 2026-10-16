"""EcoTwin AI - Telemetry Validation Service
Enforces strict physical, dimensional, relational, and temporal integrity
on every inbound sensor reading prior to persistence.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.sensor import Sensor
from app.schemas.reading import SensorReadingCreate


class TelemetryValidationError(Exception):
    """Custom exception raised when telemetry reading fails validation gates."""

    def __init__(self, code: str, detail: str):
        self.code = code
        self.detail = detail
        super().__init__(f"[{code}] {detail}")


def validate_reading_before_ingest(reading: SensorReadingCreate, db: Session) -> dict:
    """Validates an inbound sensor reading against database state and engineering rules.
    
    Returns:
        dict: Normalized and validated reading attributes ready for ORM creation.
    
    Raises:
        TelemetryValidationError: If any validation rule is violated.
    """
    # 1. Building ID Validation
    if reading.building_id not in settings.ALLOWED_BUILDING_IDS:
        raise TelemetryValidationError(
            "ERR_INVALID_BUILDING_ID",
            f"Building ID '{reading.building_id}' is invalid. Allowed IDs: {sorted(list(settings.ALLOWED_BUILDING_IDS))}"
        )

    # 2. Sensor ID Validation (Lookup in registry)
    sensor: Optional[Sensor] = db.query(Sensor).filter(Sensor.sensor_id == reading.sensor_id).first()
    if not sensor:
        raise TelemetryValidationError(
            "ERR_UNKNOWN_SENSOR_ID",
            f"Sensor ID '{reading.sensor_id}' is not registered in the database."
        )

    # 3. Building-Sensor Binding Check
    if sensor.building_id != reading.building_id:
        raise TelemetryValidationError(
            "ERR_BUILDING_SENSOR_MISMATCH",
            f"Sensor '{reading.sensor_id}' is registered to building '{sensor.building_id}', but reading specifies building '{reading.building_id}'."
        )

    # 4. Metric Validation & Consistency Check
    if reading.metric not in settings.ALLOWED_METRICS:
        raise TelemetryValidationError(
            "ERR_UNKNOWN_METRIC",
            f"Metric '{reading.metric}' is unknown. Allowed metrics: {sorted(list(settings.ALLOWED_METRICS))}"
        )
    if reading.metric != sensor.metric:
        raise TelemetryValidationError(
            "ERR_METRIC_MISMATCH",
            f"Reading metric '{reading.metric}' does not match registered sensor metric '{sensor.metric}'."
        )

    # 5. Unit Validation & Compatibility Check
    if reading.unit not in settings.ALLOWED_UNITS:
        raise TelemetryValidationError(
            "ERR_INCOMPATIBLE_UNIT",
            f"Unit '{reading.unit}' is not a whitelisted engineering unit."
        )
    if reading.unit != sensor.unit:
        raise TelemetryValidationError(
            "ERR_INCOMPATIBLE_UNIT",
            f"Reading unit '{reading.unit}' does not match registered sensor unit '{sensor.unit}'."
        )

    # 6. Source Validation
    if reading.source not in settings.ALLOWED_SOURCES:
        raise TelemetryValidationError(
            "ERR_INVALID_SOURCE_LABEL",
            f"Source label '{reading.source}' is invalid. Allowed sources: {sorted(list(settings.ALLOWED_SOURCES))}"
        )

    # 7. Numeric Value Integrity (Non-negative, Finite)
    if math.isnan(reading.value) or math.isinf(reading.value):
        raise TelemetryValidationError(
            "ERR_INVALID_NUMERIC_VALUE",
            "Reading value cannot be NaN or Infinity."
        )
    if reading.value < 0.0:
        raise TelemetryValidationError(
            "ERR_NEGATIVE_MAGNITUDE",
            f"Reading value {reading.value} is negative. Physical magnitudes must be non-negative."
        )

    # 8. Timestamp Temporal Integrity (Timezone-Aware UTC, No future timestamps > 60s)
    ts = reading.timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    else:
        ts = ts.astimezone(timezone.utc)

    now_utc = datetime.now(timezone.utc)
    if ts > (now_utc + timedelta(seconds=60)):
        raise TelemetryValidationError(
            "ERR_INVALID_TIMESTAMP",
            f"Timestamp '{ts.isoformat()}' is in the future (> 60s ahead of system time '{now_utc.isoformat()}')."
        )

    # 9. Quality Envelope Determination
    quality_status = reading.quality_status
    if sensor.max_valid_reading is not None and reading.value > sensor.max_valid_reading:
        quality_status = "OUT_OF_BOUNDS"
    elif reading.value < sensor.min_valid_reading:
        quality_status = "OUT_OF_BOUNDS"

    return {
        "sensor_id": reading.sensor_id,
        "building_id": reading.building_id,
        "metric": reading.metric,
        "value": float(reading.value),
        "unit": reading.unit,
        "timestamp": ts,
        "source": reading.source,
        "quality_status": quality_status,
    }
