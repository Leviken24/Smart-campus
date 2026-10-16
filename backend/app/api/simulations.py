"""EcoTwin AI - Simulations API Router
Provides endpoints for executing deterministic simulation scenarios,
fetching individual audited scenarios, and listing scenario history.
"""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.simulation import (
    SimulationRunRequest,
    SimulationRunResponse,
    SimulationScenarioListItem,
    SimulationScenarioListResponse,
    SimulationComparisons,
    ResourceStreamEnum,
)
from app.schemas.sensor import BuildingIdType
from app.services.simulation_engine import (
    SimulationEngineError,
    run_deterministic_simulation,
    get_scenario_by_id,
    list_simulation_scenarios,
)

router = APIRouter(prefix="/simulations", tags=["Deterministic Simulations"])


@router.post(
    "/run",
    response_model=SimulationRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Run deterministic simulation scenario",
)
def run_simulation(
    request: SimulationRunRequest,
    db: Session = Depends(get_db),
) -> SimulationRunResponse:
    """Executes a pure deterministic simulation comparing Baseline -> Scenario -> Projected Outcome.
    
    Performs all numerical calculations within the deterministic calculation layer (no AI calculation).
    Permanently preserves the distinction between physical baseline and hypothetical scenario projection.
    """
    try:
        return run_deterministic_simulation(request, db)
    except SimulationEngineError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": e.code, "message": e.detail},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ERR_SIMULATION_EXECUTION_FAILED", "message": str(e)},
        )


@router.get(
    "/{scenario_id}",
    response_model=SimulationRunResponse,
    summary="Get saved simulation scenario by ID",
)
def get_simulation_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
) -> SimulationRunResponse:
    """Retrieves an audited simulation scenario snapshot by unique scenario ID."""
    scenario = get_scenario_by_id(scenario_id, db)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation scenario '{scenario_id}' not found.",
        )

    baseline_dict = json.loads(scenario.baseline_values)
    scenario_dict = json.loads(scenario.scenario_parameters)
    projected_dict = json.loads(scenario.projected_values)

    res_stream = scenario.resource_stream.upper()
    base_val = (
        baseline_dict.get("energy_kwh")
        if res_stream == "ENERGY"
        else baseline_dict.get("total_leak_volume_litres")
        if res_stream == "WATER"
        else baseline_dict.get("segregated_mass_kg")
    )
    proj_val = (
        projected_dict.get("projected_energy_kwh")
        if res_stream == "ENERGY"
        else projected_dict.get("projected_leak_volume_litres")
        if res_stream == "WATER"
        else projected_dict.get("projected_segregated_mass_kg")
    )

    assumptions_out = None
    if scenario.assumptions:
        try:
            parsed = json.loads(scenario.assumptions)
            assumptions_out = parsed if isinstance(parsed, list) else [str(parsed)]
        except Exception:
            assumptions_out = [scenario.assumptions]

    return SimulationRunResponse(
        scenario_id=scenario.scenario_id,
        building_id=scenario.building_id,
        scenario_name=scenario.scenario_name,
        resource_stream=res_stream,
        resource_type=scenario.resource_stream.lower(),
        intervention=scenario_dict.get("intervention", "custom"),
        calculation_method=scenario.calculation_method,
        calculation_version=scenario.calculation_version,
        baseline_values=baseline_dict,
        scenario_parameters=scenario_dict,
        projected_values=projected_dict,
        comparisons=SimulationComparisons(
            absolute_difference=scenario.absolute_difference,
            percentage_difference=scenario.percentage_difference,
            calculation_status=scenario.calculation_status,  # type: ignore
        ),
        baseline_value=base_val,
        projected_value=proj_val,
        unit=scenario.unit,
        absolute_savings=scenario.absolute_difference,
        percentage_reduction=scenario.percentage_difference,
        cost_saved=scenario.cost_saved,
        estimated_cost_savings=scenario.cost_saved,
        currency="USD" if scenario.cost_saved is not None else None,
        emissions_avoided_kg_co2e=scenario.emissions_avoided_kg_co2e,
        source="simulated",
        is_projection=True,
        provenance_label="projected_simulation",
        assumptions=assumptions_out,
        evaluated_at=scenario.created_at,
        created_at=scenario.created_at,
    )


@router.get(
    "",
    response_model=SimulationScenarioListResponse,
    summary="List saved simulation scenarios",
)
def list_scenarios(
    building_id: Optional[BuildingIdType] = Query(None, description="Filter by building"),
    resource_stream: Optional[str] = Query(None, description="Filter by resource stream (ENERGY, WATER, WASTE)"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type (energy, water, waste)"),
    limit: int = Query(20, ge=1, le=100, description="Page limit (1-100)"),
    offset: int = Query(0, ge=0, description="Page offset (>= 0)"),
    db: Session = Depends(get_db),
) -> SimulationScenarioListResponse:
    """Returns a paginated list of audited simulation scenarios."""
    filter_stream = None
    raw_stream = resource_stream or resource_type
    if raw_stream:
        filter_stream = raw_stream.upper()

    items, total_count = list_simulation_scenarios(
        db=db,
        building_id=building_id,
        resource_stream=filter_stream,
        limit=limit,
        offset=offset,
    )

    list_items = []
    for item in items:
        interv = None
        try:
            params_dict = json.loads(item.scenario_parameters)
            interv = params_dict.get("intervention")
        except Exception:
            pass

        list_items.append(
            SimulationScenarioListItem(
                scenario_id=item.scenario_id,
                scenario_name=item.scenario_name,
                building_id=item.building_id,
                resource_stream=item.resource_stream,
                resource_type=item.resource_stream.lower(),
                intervention=interv,
                created_at=item.created_at,
                absolute_difference=item.absolute_difference,
                percentage_difference=item.percentage_difference,
                absolute_savings=item.absolute_difference,
                percentage_reduction=item.percentage_difference,
                cost_saved=item.cost_saved,
                estimated_cost_savings=item.cost_saved,
                currency="USD" if item.cost_saved is not None else None,
                unit=item.unit,
                calculation_status=item.calculation_status,
                is_projection=True,
                provenance_label="projected_simulation",
            )
        )

    return SimulationScenarioListResponse(
        items=list_items,
        total_count=total_count,
        limit=limit,
        offset=offset,
    )
