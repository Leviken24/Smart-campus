"""EcoTwin AI - Buildings API Router
Provides endpoints for building states and historical telemetry time-series.
"""

from datetime import datetime
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.building import Building
from app.models.reading import SensorReading
from app.schemas.building import BuildingRead
from app.schemas.reading import SensorReadingRead
from app.schemas.sensor import BuildingIdType, MetricType, SourceType
from app.services.digital_twin import build_building_read_dto

router = APIRouter(prefix="/buildings", tags=["Buildings Digital Twin"])


@router.get("", response_model=list[BuildingRead], summary="List all campus buildings")
def list_buildings(db: Session = Depends(get_db)) -> list[BuildingRead]:
    """Returns structured Digital Twin state for all canonical campus buildings."""
    buildings = db.query(Building).all()
    return [build_building_read_dto(b, db) for b in buildings]


@router.get("/{building_id}", response_model=BuildingRead, summary="Get single building state")
def get_building(building_id: str, db: Session = Depends(get_db)) -> BuildingRead:
    """Returns structured Digital Twin state for a specific building (ACADEMIC, LIB, RESIDENCE)."""
    building = db.query(Building).filter(Building.building_id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building '{building_id}' not found.",
        )
    return build_building_read_dto(building, db)


@router.get("/{building_id}/readings", response_model=list[SensorReadingRead], summary="Get building time-series readings")
def get_building_readings(
    building_id: str,
    sensor_id: Optional[str] = Query(None, description="Filter by sensor ID"),
    metric: Optional[MetricType] = Query(None, description="Filter by metric"),
    source: Optional[SourceType] = Query(None, description="Filter by provenance (real, manual, simulated)"),
    start_time: Optional[datetime] = Query(None, description="Start timestamp filter (ISO 8601 UTC)"),
    end_time: Optional[datetime] = Query(None, description="End timestamp filter (ISO 8601 UTC)"),
    interval: Optional[Literal["raw", "hourly", "daily"]] = Query("raw", description="Aggregation interval: raw, hourly, daily"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum readings to return (1-1000)"),
    db: Session = Depends(get_db),
) -> list[SensorReadingRead]:
    """Queries time-series telemetry readings for a specific building with optional filters."""
    # Ensure building exists
    building = db.query(Building).filter(Building.building_id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building '{building_id}' not found.",
        )

    query = db.query(SensorReading).filter(SensorReading.building_id == building_id)

    if sensor_id:
        query = query.filter(SensorReading.sensor_id == sensor_id)
    if metric:
        query = query.filter(SensorReading.metric == metric)
    if source:
        query = query.filter(SensorReading.source == source)
    if start_time:
        query = query.filter(SensorReading.timestamp >= start_time)
    if end_time:
        query = query.filter(SensorReading.timestamp <= end_time)

    readings = query.order_by(SensorReading.timestamp.desc()).limit(limit).all()
    return readings
