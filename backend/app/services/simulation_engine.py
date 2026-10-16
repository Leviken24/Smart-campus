"""EcoTwin AI - Deterministic Simulation Engine Service
Domain logic orchestrating baseline evaluation, intervention calculation,
differential comparison, status determination, and persistent scenario auditing.
Separated entirely from routing, AI/Grok, CV, and UI logic.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.config import settings
from app.models.scenario import SimulationScenario
from app.models.building import Building
from app.schemas.simulation import (
    SimulationRunRequest,
    SimulationRunResponse,
    SimulationComparisons,
    CalculationStatusEnum,
    EnergyBaselineInput,
    EnergyInterventionParams,
    WaterBaselineInput,
    WaterInterventionParams,
    WasteBaselineInput,
    WasteInterventionParams,
)
from app.services.simulation_math import (
    calculate_energy_kwh,
    calculate_energy_saved_kwh,
    calculate_reduction_percent,
    calculate_water_leak_volume_litres,
    calculate_water_saved_litres,
    calculate_water_reduction_percent,
    calculate_segregated_waste_kg,
    calculate_waste_segregation_diff_kg,
    calculate_waste_segregation_diff_percent,
)


class SimulationEngineError(Exception):
    """Exception raised when simulation evaluation encounters validation or logic failures."""
    def __init__(self, code: str, detail: str):
        self.code = code
        self.detail = detail
        super().__init__(f"[{code}] {detail}")


def generate_simulation_assumptions(
    resource_stream: str,
    intervention: Optional[str],
    baseline_values: dict[str, Any],
    scenario_parameters: dict[str, Any],
    tariff: Optional[float],
    emissions_factor: Optional[float],
    user_assumptions: Optional[Any],
) -> list[str]:
    """Generates structured, human-readable, transparent simulation assumptions."""
    assumptions_list: list[str] = []

    # 1. Include user-supplied assumption note if provided
    if user_assumptions:
        if isinstance(user_assumptions, list):
            for item in user_assumptions:
                if str(item).strip():
                    assumptions_list.append(str(item).strip())
        elif isinstance(user_assumptions, str) and user_assumptions.strip():
            assumptions_list.append(user_assumptions.strip())

    # 2. Resource-stream specific transparent engineering assumptions
    if resource_stream == "ENERGY":
        power_kw = baseline_values.get("power_kw", 0.0)
        base_hrs = baseline_values.get("operating_hours_per_day", 0.0)
        days = scenario_parameters.get("operating_days", baseline_values.get("operating_days", 30.0))
        target_power = scenario_parameters.get("target_power_kw", power_kw)
        target_hrs = scenario_parameters.get("target_operating_hours_per_day", base_hrs)

        if intervention == "reduce_operating_hours" or (power_kw == target_power and base_hrs != target_hrs):
            assumptions_list.append(f"Constant aggregate power load of {power_kw:.1f} kW")
            assumptions_list.append(f"Operating hours reduced from {base_hrs:.1f} to {target_hrs:.1f} hrs/day over {days:.0f} days")
        elif intervention in ("replace_lighting", "lighting_retrofit") or (power_kw != target_power and base_hrs == target_hrs):
            assumptions_list.append(f"Connected load reduced from {power_kw:.1f} kW to {target_power:.1f} kW via equipment retrofit over {days:.0f} days")
            assumptions_list.append(f"Operating schedule constant at {target_hrs:.1f} hrs/day")
        else:
            assumptions_list.append(f"Baseline power load of {power_kw:.1f} kW at {base_hrs:.1f} hrs/day")
            assumptions_list.append(f"Simulated target power load of {target_power:.1f} kW at {target_hrs:.1f} hrs/day over {days:.0f} days")

        if tariff is not None:
            assumptions_list.append(f"Electricity tariff assumed at ${tariff:.2f} per kWh")
        if emissions_factor is not None:
            assumptions_list.append(f"Grid carbon intensity factor applied at {emissions_factor:.2f} kg CO2e/kWh")

    elif resource_stream == "WATER":
        flow = baseline_values.get("flow_litres_per_minute", 0.0)
        dur = baseline_values.get("duration_minutes", 0.0)
        remediated_flow = scenario_parameters.get("remediated_flow_litres_per_minute", 0.0)

        if intervention == "leak_repair" or remediated_flow == 0.0:
            assumptions_list.append(f"Active leak flow rate estimated at {flow:.1f} L/min over {dur:.0f} minutes")
            assumptions_list.append(f"Complete leak elimination achieved (0.0 L/min post-repair)")
        else:
            assumptions_list.append(f"Baseline leak flow rate of {flow:.1f} L/min remediated to {remediated_flow:.1f} L/min over {dur:.0f} minutes")

        if tariff is not None:
            assumptions_list.append(f"Water utility tariff assumed at ${tariff:.4f} per L")

    elif resource_stream == "WASTE":
        total_kg = baseline_values.get("total_waste_kg", 0.0)
        base_frac = baseline_values.get("segregation_fraction", 0.0)
        target_frac = scenario_parameters.get("target_segregation_fraction", 0.0)

        assumptions_list.append(f"Total campus waste stream evaluated at {total_kg:.1f} kg")
        assumptions_list.append(f"Segregation fraction improved from {base_frac * 100:.1f}% to {target_frac * 100:.1f}%")
        if intervention == "waste_bin_intervention":
            assumptions_list.append("Color-coded multi-stream waste bins deployed at high-traffic aggregation points")
        elif intervention == "collection_schedule":
            assumptions_list.append("Optimized collection routing and frequency deployed to reduce bin overflow")

    return assumptions_list


def run_deterministic_simulation(request: SimulationRunRequest, db: Session) -> SimulationRunResponse:
    """Executes a pure deterministic simulation comparing Baseline -> Scenario -> Projected Outcome.
    
    Guarantees:
    - Zero AI participation in numerical calculation.
    - Baseline values are strictly preserved and never mutated.
    - Provenance permanently tagged as source: 'simulated', is_projection: True.
    - Safe handling of zero-baseline division to prevent div/0 crashes.
    """
    # 1. Validate Building Exists
    if request.building_id not in settings.ALLOWED_BUILDING_IDS:
        raise SimulationEngineError(
            "ERR_INVALID_BUILDING_ID",
            f"Building ID '{request.building_id}' is invalid. Allowed IDs: {sorted(list(settings.ALLOWED_BUILDING_IDS))}"
        )

    building = db.query(Building).filter(Building.building_id == request.building_id).first()
    if not building:
        raise SimulationEngineError(
            "ERR_BUILDING_NOT_FOUND",
            f"Building '{request.building_id}' does not exist in the database."
        )

    # 2. Normalize Resource Stream & Intervention Type
    raw_stream = request.resource_stream or request.resource_type
    if not raw_stream:
        raise SimulationEngineError(
            "ERR_MISSING_STREAM",
            "Either resource_stream or resource_type must be provided."
        )
    resource_stream = str(raw_stream).upper()
    if resource_stream not in ("ENERGY", "WATER", "WASTE"):
        raise SimulationEngineError(
            "ERR_INVALID_STREAM",
            f"Resource stream '{raw_stream}' is invalid. Allowed: ENERGY, WATER, WASTE."
        )

    intervention = request.intervention
    evaluated_at = datetime.now(timezone.utc)
    calculation_version = "1.0.0"

    baseline_values: dict[str, Any] = {}
    scenario_parameters: dict[str, Any] = {}
    projected_values: dict[str, Any] = {}
    absolute_difference: float = 0.0
    percentage_difference: Optional[float] = None
    calculation_status: CalculationStatusEnum = "VALID"
    unit: str = ""
    calculation_method: str = ""
    cost_saved: Optional[float] = None
    emissions_avoided: Optional[float] = None

    # ========================================================================
    # 3. STREAM EVALUATIONS
    # ========================================================================
    if resource_stream == "ENERGY":
        # Generic input adaptation if baseline/parameters dicts supplied
        if not request.energy_baseline and request.baseline:
            try:
                request.energy_baseline = EnergyBaselineInput(
                    power_kw=float(request.baseline["power_kw"]),
                    operating_hours_per_day=float(request.baseline["operating_hours_per_day"]),
                    operating_days=float(request.baseline.get("operating_days", 30.0)),
                )
            except Exception as e:
                raise SimulationEngineError("ERR_INVALID_BASELINE_PARAMS", f"Invalid energy baseline parameters: {e}")

        # Retrieve or inherit baseline
        if request.energy_baseline:
            eb = request.energy_baseline
        else:
            from app.services.digital_twin import get_building_resource_summary
            summary = get_building_resource_summary(building, db)
            eb = EnergyBaselineInput(
                power_kw=summary.energy.power_kw,
                operating_hours_per_day=building.standard_daily_hours,
                operating_days=building.operating_days,
            )

        # Adapt generic parameters to energy_intervention if needed
        if not request.energy_intervention and request.parameters:
            try:
                if intervention == "reduce_operating_hours":
                    target_p = eb.power_kw
                    target_h = float(request.parameters.get("proposed_hours_per_day", request.parameters.get("target_operating_hours_per_day", eb.operating_hours_per_day)))
                    target_d = float(request.parameters.get("operating_days", eb.operating_days))
                elif intervention in ("replace_lighting", "lighting_retrofit"):
                    target_p = float(request.parameters.get("target_power_kw", request.parameters.get("proposed_power_kw", eb.power_kw)))
                    target_h = float(request.parameters.get("operating_hours_per_day", request.parameters.get("target_operating_hours_per_day", eb.operating_hours_per_day)))
                    target_d = float(request.parameters.get("operating_days", eb.operating_days))
                else:
                    target_p = float(request.parameters.get("target_power_kw", request.parameters.get("proposed_power_kw", eb.power_kw)))
                    target_h = float(request.parameters.get("target_operating_hours_per_day", request.parameters.get("proposed_hours_per_day", eb.operating_hours_per_day)))
                    target_d = float(request.parameters.get("operating_days", eb.operating_days))

                request.energy_intervention = EnergyInterventionParams(
                    target_power_kw=target_p,
                    target_operating_hours_per_day=target_h,
                    operating_days=target_d,
                )
            except Exception as e:
                raise SimulationEngineError("ERR_INVALID_INTERVENTION_PARAMS", f"Invalid energy intervention parameters: {e}")

        # Check tariff and emissions factor from parameters if overrides not set
        if request.tariff_override is None and request.parameters:
            t_val = request.parameters.get("electricity_tariff_per_kwh", request.parameters.get("tariff_override", request.parameters.get("tariff")))
            if t_val is not None:
                request.tariff_override = float(t_val)
        if request.emissions_factor_override is None and request.parameters:
            e_val = request.parameters.get("emissions_factor_override", request.parameters.get("emissions_factor"))
            if e_val is not None:
                request.emissions_factor_override = float(e_val)

        if not request.energy_intervention:
            raise SimulationEngineError(
                "ERR_MISSING_ENERGY_PARAMS",
                "energy_intervention or parameters is required when resource_stream is ENERGY."
            )

        calculation_method = "deterministic_energy_v1"
        unit = "kWh"
        ei = request.energy_intervention

        # Baseline Calculation
        baseline_kwh = calculate_energy_kwh(
            power_kw=eb.power_kw,
            operating_hours_per_day=eb.operating_hours_per_day,
            operating_days=eb.operating_days,
        )

        # Scenario Projection Calculation
        scenario_kwh = calculate_energy_kwh(
            power_kw=ei.target_power_kw,
            operating_hours_per_day=ei.target_operating_hours_per_day,
            operating_days=ei.operating_days,
        )

        # Comparison
        saved_kwh = calculate_energy_saved_kwh(baseline_kwh, scenario_kwh)
        pct_reduction = calculate_reduction_percent(baseline_kwh, scenario_kwh)

        absolute_difference = round(saved_kwh, 2)
        percentage_difference = round(pct_reduction, 2) if pct_reduction is not None else None

        if baseline_kwh == 0.0:
            calculation_status = "UNDEFINED_ZERO_BASELINE"
        elif saved_kwh < 0.0:
            calculation_status = "NEGATIVE_REDUCTION"
        else:
            calculation_status = "VALID"

        # Snapshots
        baseline_values = {
            "power_kw": eb.power_kw,
            "operating_hours_per_day": eb.operating_hours_per_day,
            "operating_days": eb.operating_days,
            "energy_kwh": round(baseline_kwh, 2),
            "unit": "kWh",
        }
        scenario_parameters = {
            "target_power_kw": ei.target_power_kw,
            "target_operating_hours_per_day": ei.target_operating_hours_per_day,
            "operating_days": ei.operating_days,
            "intervention": intervention or "custom",
            "unit": "kWh",
        }
        projected_values = {
            "projected_energy_kwh": round(scenario_kwh, 2),
            "energy_saved_kwh": round(saved_kwh, 2),
            "unit": "kWh",
            "is_projection": True,
        }

        # Financial & Emissions (only computed if overrides provided; never invent tariffs)
        if request.tariff_override is not None:
            cost_saved = round(saved_kwh * request.tariff_override, 2)
        if request.emissions_factor_override is not None:
            emissions_avoided = round(saved_kwh * request.emissions_factor_override, 2)

    elif resource_stream == "WATER":
        # Generic input adaptation if baseline/parameters dicts supplied
        if not request.water_baseline and request.baseline:
            try:
                request.water_baseline = WaterBaselineInput(
                    flow_litres_per_minute=float(request.baseline["flow_litres_per_minute"]),
                    duration_minutes=float(request.baseline["duration_minutes"]),
                )
            except Exception as e:
                raise SimulationEngineError("ERR_INVALID_BASELINE_PARAMS", f"Invalid water baseline parameters: {e}")

        # Retrieve or inherit baseline
        if request.water_baseline:
            wb = request.water_baseline
        else:
            from app.services.digital_twin import get_building_resource_summary
            summary = get_building_resource_summary(building, db)
            wb = WaterBaselineInput(
                flow_litres_per_minute=summary.water.flow_litres_per_minute,
                duration_minutes=60.0,
            )

        # Adapt generic parameters to water_intervention if needed
        if not request.water_intervention and request.parameters:
            try:
                remed_flow = float(request.parameters.get("remediated_flow_litres_per_minute", 0.0))
                dur = float(request.parameters.get("duration_minutes", wb.duration_minutes))
                request.water_intervention = WaterInterventionParams(
                    remediated_flow_litres_per_minute=remed_flow,
                    duration_minutes=dur,
                )
            except Exception as e:
                raise SimulationEngineError("ERR_INVALID_INTERVENTION_PARAMS", f"Invalid water intervention parameters: {e}")

        if request.tariff_override is None and request.parameters:
            t_val = request.parameters.get("water_tariff_per_litre", request.parameters.get("tariff_override", request.parameters.get("tariff")))
            if t_val is not None:
                request.tariff_override = float(t_val)

        if not request.water_intervention:
            raise SimulationEngineError(
                "ERR_MISSING_WATER_PARAMS",
                "water_intervention or parameters is required when resource_stream is WATER."
            )

        calculation_method = "deterministic_water_v1"
        unit = "L"
        wi = request.water_intervention

        # Baseline Leak Calculation
        baseline_litres = calculate_water_leak_volume_litres(
            flow_litres_per_minute=wb.flow_litres_per_minute,
            duration_minutes=wb.duration_minutes,
        )

        # Scenario Projection Calculation
        scenario_litres = calculate_water_leak_volume_litres(
            flow_litres_per_minute=wi.remediated_flow_litres_per_minute,
            duration_minutes=wi.duration_minutes,
        )

        # Comparison
        saved_litres = calculate_water_saved_litres(baseline_litres, scenario_litres)
        pct_reduction = calculate_water_reduction_percent(baseline_litres, scenario_litres)

        absolute_difference = round(saved_litres, 2)
        percentage_difference = round(pct_reduction, 2) if pct_reduction is not None else None

        if baseline_litres == 0.0:
            calculation_status = "UNDEFINED_ZERO_BASELINE"
        elif saved_litres < 0.0:
            calculation_status = "NEGATIVE_REDUCTION"
        else:
            calculation_status = "VALID"

        baseline_values = {
            "flow_litres_per_minute": wb.flow_litres_per_minute,
            "duration_minutes": wb.duration_minutes,
            "total_leak_volume_litres": round(baseline_litres, 2),
            "unit": "L",
        }
        scenario_parameters = {
            "remediated_flow_litres_per_minute": wi.remediated_flow_litres_per_minute,
            "duration_minutes": wi.duration_minutes,
            "intervention": intervention or "custom",
            "unit": "L",
        }
        projected_values = {
            "projected_leak_volume_litres": round(scenario_litres, 2),
            "water_saved_litres": round(saved_litres, 2),
            "unit": "L",
            "is_projection": True,
        }

        if request.tariff_override is not None:
            cost_saved = round(saved_litres * request.tariff_override, 2)

    elif resource_stream == "WASTE":
        # Generic input adaptation if baseline/parameters dicts supplied
        if not request.waste_baseline and request.baseline:
            try:
                request.waste_baseline = WasteBaselineInput(
                    total_waste_kg=float(request.baseline["total_waste_kg"]),
                    segregation_fraction=float(request.baseline["segregation_fraction"]),
                )
            except Exception as e:
                raise SimulationEngineError("ERR_INVALID_BASELINE_PARAMS", f"Invalid waste baseline parameters: {e}")

        # Retrieve or inherit baseline
        if request.waste_baseline:
            wsb = request.waste_baseline
        else:
            from app.services.digital_twin import get_building_resource_summary
            summary = get_building_resource_summary(building, db)
            wsb = WasteBaselineInput(
                total_waste_kg=summary.waste.daily_waste_kg,
                segregation_fraction=summary.waste.segregation_fraction,
            )

        # Adapt generic parameters to waste_intervention if needed
        if not request.waste_intervention and request.parameters:
            try:
                target_frac = float(request.parameters.get("target_segregation_fraction", request.parameters.get("proposed_segregation_fraction", 0.0)))
                request.waste_intervention = WasteInterventionParams(
                    target_segregation_fraction=target_frac,
                )
            except Exception as e:
                raise SimulationEngineError("ERR_INVALID_INTERVENTION_PARAMS", f"Invalid waste intervention parameters: {e}")

        if not request.waste_intervention:
            raise SimulationEngineError(
                "ERR_MISSING_WASTE_PARAMS",
                "waste_intervention or parameters is required when resource_stream is WASTE."
            )

        calculation_method = "deterministic_waste_v1"
        unit = "kg"
        wsi = request.waste_intervention

        # Baseline Segregated Mass
        baseline_seg_kg = calculate_segregated_waste_kg(
            total_waste_kg=wsb.total_waste_kg,
            segregation_fraction=wsb.segregation_fraction,
        )

        # Scenario Segregated Mass
        scenario_seg_kg = calculate_segregated_waste_kg(
            total_waste_kg=wsb.total_waste_kg,
            segregation_fraction=wsi.target_segregation_fraction,
        )

        # Comparison (Increase in segregated mass)
        diff_kg = calculate_waste_segregation_diff_kg(baseline_seg_kg, scenario_seg_kg)
        pct_improvement = calculate_waste_segregation_diff_percent(baseline_seg_kg, scenario_seg_kg)

        absolute_difference = round(diff_kg, 2)
        percentage_difference = round(pct_improvement, 2) if pct_improvement is not None else None

        if baseline_seg_kg == 0.0:
            calculation_status = "UNDEFINED_ZERO_BASELINE"
        elif diff_kg < 0.0:
            calculation_status = "NEGATIVE_REDUCTION"
        else:
            calculation_status = "VALID"

        baseline_values = {
            "total_waste_kg": wsb.total_waste_kg,
            "segregation_fraction": wsb.segregation_fraction,
            "segregated_mass_kg": round(baseline_seg_kg, 2),
            "unsegregated_mass_kg": round(wsb.total_waste_kg - baseline_seg_kg, 2),
            "unit": "kg",
        }
        scenario_parameters = {
            "target_segregation_fraction": wsi.target_segregation_fraction,
            "intervention": intervention or "custom",
            "unit": "dimensionless_fraction",
        }
        projected_values = {
            "projected_segregated_mass_kg": round(scenario_seg_kg, 2),
            "projected_unsegregated_mass_kg": round(wsb.total_waste_kg - scenario_seg_kg, 2),
            "segregated_mass_increase_kg": round(diff_kg, 2),
            "unit": "kg",
            "is_projection": True,
        }

    # Format transparent assumptions
    formatted_assumptions = generate_simulation_assumptions(
        resource_stream=resource_stream,
        intervention=intervention,
        baseline_values=baseline_values,
        scenario_parameters=scenario_parameters,
        tariff=request.tariff_override,
        emissions_factor=request.emissions_factor_override,
        user_assumptions=request.assumptions,
    )

    # Compute baseline_val and projected_val for top-level convenience
    baseline_val = (
        baseline_values.get("energy_kwh")
        if resource_stream == "ENERGY"
        else baseline_values.get("total_leak_volume_litres")
        if resource_stream == "WATER"
        else baseline_values.get("segregated_mass_kg")
    )
    projected_val = (
        projected_values.get("projected_energy_kwh")
        if resource_stream == "ENERGY"
        else projected_values.get("projected_leak_volume_litres")
        if resource_stream == "WATER"
        else projected_values.get("projected_segregated_mass_kg")
    )

    # ========================================================================
    # 4. OPTIONAL PERSISTENCE
    # ========================================================================
    persisted_scenario_id: Optional[str] = None
    if request.save_scenario:
        scenario_id_str = str(uuid.uuid4())
        scenario_entity = SimulationScenario(
            scenario_id=scenario_id_str,
            building_id=request.building_id,
            scenario_name=request.scenario_name or "Simulation Scenario",
            resource_stream=resource_stream,
            calculation_method=calculation_method,
            calculation_version=calculation_version,
            baseline_values=json.dumps(baseline_values),
            scenario_parameters=json.dumps(scenario_parameters),
            projected_values=json.dumps(projected_values),
            absolute_difference=absolute_difference,
            percentage_difference=percentage_difference,
            unit=unit,
            calculation_status=calculation_status,
            cost_saved=cost_saved,
            emissions_avoided_kg_co2e=emissions_avoided,
            source="simulated",
            is_projection=True,
            assumptions=json.dumps(formatted_assumptions),
            created_by=request.created_by or "system",
            created_at=evaluated_at,
        )
        try:
            db.add(scenario_entity)
            db.commit()
            persisted_scenario_id = scenario_id_str
        except Exception as e:
            db.rollback()
            raise SimulationEngineError(
                "ERR_SCENARIO_PERSIST_FAILED",
                f"Failed to persist simulation scenario to database: {e}"
            )

    return SimulationRunResponse(
        scenario_id=persisted_scenario_id,
        building_id=request.building_id,
        scenario_name=request.scenario_name or "Simulation Scenario",
        resource_stream=resource_stream,
        resource_type=resource_stream.lower(),
        intervention=intervention or "custom",
        calculation_method=calculation_method,
        calculation_version=calculation_version,
        baseline_values=baseline_values,
        scenario_parameters=scenario_parameters,
        projected_values=projected_values,
        comparisons=SimulationComparisons(
            absolute_difference=absolute_difference,
            percentage_difference=percentage_difference,
            calculation_status=calculation_status,
        ),
        baseline_value=baseline_val,
        projected_value=projected_val,
        unit=unit,
        absolute_savings=absolute_difference,
        percentage_reduction=percentage_difference,
        cost_saved=cost_saved,
        estimated_cost_savings=cost_saved,
        currency="USD" if cost_saved is not None else None,
        emissions_avoided_kg_co2e=emissions_avoided,
        source="simulated",
        is_projection=True,
        provenance_label="projected_simulation",
        assumptions=formatted_assumptions,
        evaluated_at=evaluated_at,
        created_at=evaluated_at,
    )


def get_scenario_by_id(scenario_id: str, db: Session) -> Optional[SimulationScenario]:
    """Retrieves a persisted scenario by its unique identifier."""
    return db.query(SimulationScenario).filter(SimulationScenario.scenario_id == scenario_id).first()


def list_simulation_scenarios(
    db: Session,
    building_id: Optional[str] = None,
    resource_stream: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[SimulationScenario], int]:
    """Retrieves paginated scenario summaries with optional filtering."""
    query = db.query(SimulationScenario)
    if building_id:
        query = query.filter(SimulationScenario.building_id == building_id)
    if resource_stream:
        query = query.filter(SimulationScenario.resource_stream == resource_stream)

    total_count = query.count()
    items = query.order_by(SimulationScenario.created_at.desc()).offset(offset).limit(limit).all()
    return items, total_count
