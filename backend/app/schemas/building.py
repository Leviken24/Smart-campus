"""EcoTwin AI - Building Pydantic Schemas
Defines structured Digital Twin state representation for buildings and campus.
"""

from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.sensor import BuildingIdType

ObservationStatusType = Literal[
    "requires_review",
    "confirmed",
    "dismissed",
    "resolved",
    "reported",
    "reviewed",
    "actioned",
    "rejected",
]
ObservationSourceType = Literal["image_analysis", "sensor_rule", "manual"]
StreamType = Literal["ENERGY", "WATER", "WASTE"]


class OperatingSchedule(BaseModel):
    standard_daily_hours: float = Field(..., ge=0.0, le=24.0, description="Operating hours per day (0.0 - 24.0)")
    operating_days: float = Field(..., ge=0.0, description="Operating days count (>= 0.0)")


class EnergySummary(BaseModel):
    power_kw: float = Field(default=0.0, ge=0.0, description="Instantaneous power demand in kW")
    daily_energy_kwh: float = Field(default=0.0, ge=0.0, description="Cumulative daily energy in kWh")


class WaterSummary(BaseModel):
    flow_litres_per_minute: float = Field(default=0.0, ge=0.0, description="Instantaneous water flow rate in L/min")
    daily_water_litres: float = Field(default=0.0, ge=0.0, description="Cumulative daily water in Litres")


class WasteSummary(BaseModel):
    daily_waste_kg: float = Field(default=0.0, ge=0.0, description="Cumulative daily waste in kg")
    segregation_fraction: float = Field(default=0.0, ge=0.0, le=1.0, description="Fraction segregated (0.0 - 1.0)")


class ResourceSummary(BaseModel):
    energy: EnergySummary
    water: WaterSummary
    waste: WasteSummary


class BuildingObservationRead(BaseModel):
    observation_id: str
    id: Optional[str] = None
    building_id: str
    observation_type: str = "waste_accumulation"
    stream_type: Optional[StreamType] = None
    status: ObservationStatusType = "requires_review"
    source: ObservationSourceType = "image_analysis"
    summary: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    provider_metadata: Optional[Any] = None
    reported_at: datetime
    created_at: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewer_note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context: Any) -> None:
        if not self.id:
            self.id = self.observation_id
        if not self.description:
            self.description = self.summary
        if not self.created_at and self.reported_at:
            self.created_at = self.reported_at.isoformat()


class BuildingObservationCreate(BaseModel):
    observation_id: Optional[str] = None
    building_id: BuildingIdType
    observation_type: str = Field(default="waste_accumulation", description="e.g. waste_accumulation, water_leakage, energy_waste")
    stream_type: Optional[StreamType] = None
    status: ObservationStatusType = Field(default="requires_review", description="Default requires_review until human review")
    source: ObservationSourceType = Field(default="image_analysis", description="image_analysis, sensor_rule, manual")
    summary: str = Field(..., description="Observation description")
    image_url: Optional[str] = None
    provider_metadata: Optional[str] = None


class BuildingObservationUpdate(BaseModel):
    status: Optional[ObservationStatusType] = None
    building_id: Optional[BuildingIdType] = None
    reviewer_note: Optional[str] = None


class BuildingRead(BaseModel):
    building_id: BuildingIdType
    name: str
    operating_schedule: OperatingSchedule
    resource_summary: ResourceSummary
    associated_sensors: list[str] = Field(default_factory=list)
    relevant_observations: list[BuildingObservationRead] = Field(default_factory=list)
    relevant_simulation_scenarios: list[str] = Field(default_factory=list)
    active_issues_count: int = 0
    requires_review_count: int = 0
    gross_floor_area_sqm: Optional[float] = None
    archetype: Optional[str] = None
    construction_year: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CampusResourceTotals(BaseModel):
    total_power_kw: float
    total_daily_energy_kwh: float
    total_water_flow_lpm: float
    total_daily_water_litres: float
    total_daily_waste_kg: float
    campus_average_segregation_fraction: float


class SensorCountBreakdown(BaseModel):
    total_sensors: int
    active_sensors: int
    by_source: dict[str, int]  # {"real": x, "manual": y, "simulated": z}


class CampusStatusSummary(BaseModel):
    active_observations_count: int = 0
    requires_review_count: int = 0
    confirmed_issues_count: int = 0


class CampusDigitalTwin(BaseModel):
    campus_name: str = "EcoTwin Sustainable University Campus"
    timestamp: datetime
    total_buildings: int
    buildings: list[BuildingRead]
    campus_resource_totals: CampusResourceTotals
    sensor_counts: SensorCountBreakdown
    status_summary: CampusStatusSummary = Field(default_factory=CampusStatusSummary)
