"""EcoTwin AI - Deterministic Simulation Schemas
Defines request and response DTOs for simulation evaluations, scenario persistence, and catalog queries.
"""

from datetime import datetime
from typing import Literal, Optional, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.sensor import BuildingIdType

ResourceStreamEnum = Literal["ENERGY", "WATER", "WASTE"]
CalculationStatusEnum = Literal["VALID", "UNDEFINED_ZERO_BASELINE", "NEGATIVE_REDUCTION"]


# ============================================================================
# STREAM-SPECIFIC INPUTS
# ============================================================================

class EnergyBaselineInput(BaseModel):
    power_kw: float = Field(..., ge=0.0, description="Baseline connected power demand in kW")
    operating_hours_per_day: float = Field(..., ge=0.0, le=24.0, description="Baseline daily operating hours (0.0 to 24.0)")
    operating_days: float = Field(..., ge=0.0, description="Baseline operational days count (>= 0)")


class EnergyInterventionParams(BaseModel):
    target_power_kw: float = Field(..., ge=0.0, description="Simulated target connected load in kW")
    target_operating_hours_per_day: float = Field(..., ge=0.0, le=24.0, description="Simulated operating hours per day (0.0 to 24.0)")
    operating_days: float = Field(..., ge=0.0, description="Operational days count for scenario (>= 0)")


class WaterBaselineInput(BaseModel):
    flow_litres_per_minute: float = Field(..., ge=0.0, description="Baseline leak flow rate in L/min")
    duration_minutes: float = Field(..., ge=0.0, description="Baseline leak duration in minutes")


class WaterInterventionParams(BaseModel):
    remediated_flow_litres_per_minute: float = Field(..., ge=0.0, description="Target post-repair flow rate in L/min")
    duration_minutes: float = Field(..., ge=0.0, description="Duration in minutes (>= 0)")


class WasteBaselineInput(BaseModel):
    total_waste_kg: float = Field(..., ge=0.0, description="Baseline total waste mass in kg")
    segregation_fraction: float = Field(..., ge=0.0, le=1.0, description="Baseline fraction segregated (0.0 to 1.0)")


class WasteInterventionParams(BaseModel):
    target_segregation_fraction: float = Field(..., ge=0.0, le=1.0, description="Simulated target fraction segregated (0.0 to 1.0)")


# ============================================================================
# SIMULATION REQUEST & RESPONSE SCHEMAS
# ============================================================================

InterventionType = Literal[
    "reduce_operating_hours",
    "replace_lighting",
    "lighting_retrofit",
    "leak_repair",
    "increase_segregation",
    "waste_bin_intervention",
    "collection_schedule",
    "custom",
]


class SimulationRunRequest(BaseModel):
    building_id: BuildingIdType = Field(..., description="Target campus building (ACADEMIC, LIB, RESIDENCE)")
    resource_stream: Optional[str] = Field(default=None, description="Resource stream (ENERGY, WATER, WASTE)")
    resource_type: Optional[str] = Field(default=None, description="Alias for resource_stream (energy, water, waste)")
    intervention: Optional[str] = Field(default=None, description="Named intervention type (e.g. reduce_operating_hours, replace_lighting, leak_repair, increase_segregation)")
    scenario_name: Optional[str] = Field(default="Simulation Scenario", max_length=128, description="Human-readable scenario title")
    save_scenario: bool = Field(default=False, description="Whether to persist scenario in database (default False for dry-runs)")
    
    # Generic baseline & parameters dictionaries (as in api-contracts.md §2.5)
    baseline: Optional[dict[str, Any]] = Field(default=None, description="Generic baseline parameters dictionary")
    parameters: Optional[dict[str, Any]] = Field(default=None, description="Generic intervention parameters dictionary")

    # Stream inputs (one must be supplied matching resource_stream or mapped from baseline/parameters)
    energy_baseline: Optional[EnergyBaselineInput] = None
    energy_intervention: Optional[EnergyInterventionParams] = None
    water_baseline: Optional[WaterBaselineInput] = None
    water_intervention: Optional[WaterInterventionParams] = None
    waste_baseline: Optional[WasteBaselineInput] = None
    waste_intervention: Optional[WasteInterventionParams] = None

    # Optional financial / environmental overrides
    tariff_override: Optional[float] = Field(default=None, ge=0.0, description="Optional electricity or water tariff override ($/kWh or $/L)")
    emissions_factor_override: Optional[float] = Field(default=None, ge=0.0, description="Optional grid emissions factor override (kg CO2e/kWh)")

    assumptions: Optional[Any] = Field(default=None, description="Human-readable rationale, observation linkage, or list of assumption strings")
    created_by: Optional[str] = Field(default="system", description="Author or system actor")


class SimulationComparisons(BaseModel):
    absolute_difference: float = Field(..., description="Absolute change (Baseline - Scenario for Energy/Water; Scenario - Baseline for Waste)")
    percentage_difference: Optional[float] = Field(None, description="Percentage change relative to baseline, or null if baseline is zero")
    calculation_status: CalculationStatusEnum = Field(..., description="Calculation integrity flag")


class SimulationRunResponse(BaseModel):
    scenario_id: Optional[str] = Field(None, description="UUID of persisted scenario, or null if dry-run")
    building_id: str
    scenario_name: str
    resource_stream: str
    resource_type: Optional[str] = None
    intervention: Optional[str] = None
    calculation_method: str
    calculation_version: str = "1.0.0"
    baseline_values: dict[str, Any]
    scenario_parameters: dict[str, Any]
    projected_values: dict[str, Any]
    comparisons: SimulationComparisons
    
    # Contract convenience fields matching docs/api-contracts.md §2.5
    baseline_value: Optional[float] = None
    projected_value: Optional[float] = None
    unit: str
    absolute_savings: Optional[float] = None
    percentage_reduction: Optional[float] = None
    cost_saved: Optional[float] = Field(None, description="Monetary savings if tariff configured/overridden, else null")
    estimated_cost_savings: Optional[float] = Field(None, description="Alias for cost_saved")
    currency: Optional[str] = Field(None, description="Currency denomination (e.g. USD) when financial savings computed")
    emissions_avoided_kg_co2e: Optional[float] = Field(None, description="Emissions avoided if factor configured/overridden, else null")
    
    source: Literal["simulated"] = "simulated"
    is_projection: Literal[True] = True
    provenance_label: str = "projected_simulation"
    assumptions: Optional[Any] = None
    evaluated_at: datetime
    created_at: Optional[datetime] = None


class SimulationScenarioListItem(BaseModel):
    scenario_id: str
    scenario_name: str
    building_id: str
    resource_stream: str
    resource_type: Optional[str] = None
    intervention: Optional[str] = None
    created_at: datetime
    absolute_difference: float
    percentage_difference: Optional[float]
    absolute_savings: Optional[float] = None
    percentage_reduction: Optional[float] = None
    cost_saved: Optional[float] = None
    estimated_cost_savings: Optional[float] = None
    currency: Optional[str] = Field(None, description="Currency denomination (e.g. USD) when financial savings computed")
    unit: str
    calculation_status: str
    is_projection: bool = True
    provenance_label: str = "projected_simulation"

    model_config = ConfigDict(from_attributes=True)


class SimulationScenarioListResponse(BaseModel):
    items: list[SimulationScenarioListItem]
    total_count: int
    limit: int
    offset: int

