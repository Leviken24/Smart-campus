"""EcoTwin AI - Sensors and Telemetry Ingestion Router
Provides endpoints for sensor registry queries, telemetry ingestion, and simulation generation.
"""

import uuid
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sensor import Sensor
from app.models.reading import SensorReading
from app.schemas.reading import (
    SensorReadingBatchCreate,
    SensorReadingCreate,
    SensorReadingIngestResponse,
    SimulateRequest,
    SimulateResponse,
)
from app.schemas.sensor import BuildingIdType, MetricType, SensorRead, SourceType
from app.services.simulator import generate_simulated_readings_for_building
from app.services.validation import TelemetryValidationError, validate_reading_before_ingest

router = APIRouter(prefix="/sensors", tags=["Sensors & Telemetry"])


@router.get("", response_model=list[SensorRead], summary="List registered sensors")
def list_sensors(
    building_id: Optional[BuildingIdType] = Query(None, description="Filter by building"),
    metric: Optional[MetricType] = Query(None, description="Filter by metric"),
    source: Optional[SourceType] = Query(None, description="Filter by source"),
    db: Session = Depends(get_db),
) -> list[SensorRead]:
    """Returns all registered sensors, optionally filtered by building, metric, or source."""
    query = db.query(Sensor)
    if building_id:
        query = query.filter(Sensor.building_id == building_id)
    if metric:
        query = query.filter(Sensor.metric == metric)
    if source:
        query = query.filter(Sensor.source == source)
    return query.all()


@router.post(
    "/readings",
    response_model=SensorReadingIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest sensor telemetry readings",
)
def ingest_readings(
    payload: Union[SensorReadingCreate, SensorReadingBatchCreate, list[SensorReadingCreate]],
    db: Session = Depends(get_db),
) -> SensorReadingIngestResponse:
    """Ingests, validates, and persists one or more telemetry readings.
    
    Rejects any reading that violates dimensional, physical, relational, or temporal integrity.
    """
    if isinstance(payload, SensorReadingBatchCreate):
        readings_to_process = payload.readings
    elif isinstance(payload, list):
        readings_to_process = payload
    else:
        readings_to_process = [payload]

    if not readings_to_process:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload contains no readings.",
        )

    validated_entities: list[SensorReading] = []
    created_ids: list[str] = []

    try:
        for item in readings_to_process:
            normalized = validate_reading_before_ingest(item, db)
            reading_id = item.reading_id or str(uuid.uuid4())
            entity = SensorReading(
                reading_id=reading_id,
                sensor_id=normalized["sensor_id"],
                building_id=normalized["building_id"],
                metric=normalized["metric"],
                value=normalized["value"],
                unit=normalized["unit"],
                timestamp=normalized["timestamp"],
                source=normalized["source"],
                quality_status=normalized["quality_status"],
            )
            validated_entities.append(entity)
            created_ids.append(reading_id)

        db.add_all(validated_entities)
        db.commit()

    except TelemetryValidationError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": e.code, "message": e.detail},
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ERR_INGESTION_FAILED", "message": str(e)},
        )

    return SensorReadingIngestResponse(
        success=True,
        ingested_count=len(created_ids),
        reading_ids=created_ids,
    )


@router.post(
    "/simulate",
    response_model=SimulateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate synthetic simulated readings",
)
def simulate_readings(
    request: SimulateRequest = SimulateRequest(),
    db: Session = Depends(get_db),
) -> SimulateResponse:
    """Generates synthetic, deterministic time-series telemetry for demonstration/testing.
    
    All generated readings are permanently classified with source: 'simulated'.
    """
    generated = generate_simulated_readings_for_building(
        db=db,
        building_id=request.building_id,
        duration_hours=request.duration_hours,
        sampling_interval_seconds=request.sampling_interval_seconds,
    )

    building_ids = [request.building_id] if request.building_id else ["ACADEMIC", "LIB", "RESIDENCE"]

    return SimulateResponse(
        success=True,
        generated_readings_count=len(generated),
        source="simulated",
        building_ids=building_ids,
        message=f"Generated {len(generated)} simulated telemetry records tagged with source='simulated'.",
    )
