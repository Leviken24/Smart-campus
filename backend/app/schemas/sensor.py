"""EcoTwin AI - Sensor Pydantic Schemas
Defines request/response validation contracts for sensors.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

MetricType = Literal["power", "energy", "water_flow", "water_volume", "waste_weight"]
UnitType = Literal["kW", "kWh", "L/min", "L", "kg"]
SourceType = Literal["real", "manual", "simulated"]
SensorStatusType = Literal["ACTIVE", "INACTIVE", "FAULT", "CALIBRATING"]
BuildingIdType = Literal["ACADEMIC", "LIB", "RESIDENCE"]


class SensorBase(BaseModel):
    sensor_id: str = Field(..., min_length=1, max_length=64, description="Unique sensor identifier")
    building_id: BuildingIdType = Field(..., description="Target campus building")
    metric: MetricType = Field(..., description="Monitored physical metric")
    unit: UnitType = Field(..., description="Standard engineering unit")
    source: SourceType = Field(default="simulated", description="Data provenance classifier")
    status: SensorStatusType = Field(default="ACTIVE", description="Operational lifecycle status")
    sampling_interval_seconds: int = Field(default=60, ge=1, le=86400, description="Telemetry frequency in seconds")
    min_valid_reading: float = Field(default=0.0, ge=0.0, description="Minimum physical valid value")
    max_valid_reading: Optional[float] = Field(default=None, ge=0.0, description="Maximum physical valid value")
    zone_id: Optional[str] = Field(default=None, max_length=64, description="Spatial zone within building")


class SensorCreate(SensorBase):
    pass


class SensorRead(SensorBase):
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
