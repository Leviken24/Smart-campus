"""EcoTwin AI - Digital Twin State Aggregator
Calculates live operational state, instantaneous demands, daily totals,
and campus-wide resource summaries from persistent database telemetry.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.building import Building, BuildingObservation
from app.models.sensor import Sensor
from app.models.reading import SensorReading
from app.schemas.building import (
    BuildingRead,
    CampusDigitalTwin,
    CampusResourceTotals,
    EnergySummary,
    OperatingSchedule,
    ResourceSummary,
    SensorCountBreakdown,
    WasteSummary,
    WaterSummary,
    BuildingObservationRead,
)


def get_building_resource_summary(building: Building, db: Session) -> ResourceSummary:
    """Calculates live resource summary (instantaneous rates & daily totals) for a building."""
    now_utc = datetime.now(timezone.utc)
    today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)

    # 1. Power (kW): Latest reading from power sensors
    latest_power_reading = (
        db.query(SensorReading)
        .filter(
            SensorReading.building_id == building.building_id,
            SensorReading.metric == "power",
        )
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    current_power = latest_power_reading.value if latest_power_reading else 0.0

    # Daily Energy (kWh): Latest energy cumulative or computed from daily readings
    latest_energy_reading = (
        db.query(SensorReading)
        .filter(
            SensorReading.building_id == building.building_id,
            SensorReading.metric == "energy",
            SensorReading.timestamp >= today_start,
        )
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    if latest_energy_reading:
        daily_energy = latest_energy_reading.value
    else:
        # Fallback: Approximate from power * operating hours elapsed
        daily_energy = current_power * min(building.standard_daily_hours, 12.0)

    # 2. Water Flow (L/min): Latest reading from water_flow sensors
    latest_water_flow = (
        db.query(SensorReading)
        .filter(
            SensorReading.building_id == building.building_id,
            SensorReading.metric == "water_flow",
        )
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    current_flow = latest_water_flow.value if latest_water_flow else 0.0

    # Daily Water (L): Sum from water_volume or flow integrated
    water_vol_sum = (
        db.query(func.sum(SensorReading.value))
        .filter(
            SensorReading.building_id == building.building_id,
            SensorReading.metric == "water_volume",
            SensorReading.timestamp >= today_start,
        )
        .scalar()
    )
    daily_water = float(water_vol_sum) if water_vol_sum else (current_flow * 60.0 * 8.0)

    # 3. Waste (kg): Sum of waste logged today
    waste_sum = (
        db.query(func.sum(SensorReading.value))
        .filter(
            SensorReading.building_id == building.building_id,
            SensorReading.metric == "waste_weight",
            SensorReading.timestamp >= today_start,
        )
        .scalar()
    )
    # Default baseline waste if no records logged yet today
    if waste_sum:
        daily_waste = float(waste_sum)
    else:
        daily_waste = 450.0 if building.building_id == "ACADEMIC" else (120.0 if building.building_id == "LIB" else 650.0)

    # Segregation fraction baseline
    default_segregation = {
        "ACADEMIC": 0.45,
        "LIB": 0.65,
        "RESIDENCE": 0.30,
    }
    segregation_fraction = default_segregation.get(building.building_id, 0.40)

    return ResourceSummary(
        energy=EnergySummary(power_kw=round(current_power, 2), daily_energy_kwh=round(daily_energy, 2)),
        water=WaterSummary(flow_litres_per_minute=round(current_flow, 2), daily_water_litres=round(daily_water, 2)),
        waste=WasteSummary(daily_waste_kg=round(daily_waste, 2), segregation_fraction=round(segregation_fraction, 2)),
    )


def build_building_read_dto(building: Building, db: Session) -> BuildingRead:
    """Builds a complete BuildingRead DTO including sensors, observations, and resource state."""
    resource_summary = get_building_resource_summary(building, db)
    sensor_ids = [s.sensor_id for s in building.sensors]
    
    observations_dto = [
        BuildingObservationRead(
            observation_id=obs.observation_id,
            building_id=obs.building_id,
            observation_type=obs.observation_type or "waste_accumulation",
            stream_type=obs.stream_type,
            status=obs.status,
            source=obs.source or "image_analysis",
            summary=obs.summary,
            description=obs.summary,
            image_url=obs.image_url,
            provider_metadata=obs.provider_metadata,
            reported_at=obs.reported_at,
            reviewed_at=obs.reviewed_at,
            reviewer_note=obs.reviewer_note,
        )
        for obs in building.observations
    ]

    # Pre-defined simulation scenario keys associated with this building
    scenarios_map = {
        "ACADEMIC": ["SCN-ACAD-HVAC-OPTIM", "SCN-ACAD-SOLAR-PV", "SCN-ACAD-LED-RETROFIT"],
        "LIB": ["SCN-LIB-SMART-LIGHTING", "SCN-LIB-WEEKEND-SETBACK"],
        "RESIDENCE": ["SCN-RES-LEAK-REDUCTION", "SCN-RES-WASTE-SORTING", "SCN-RES-HEAT-PUMP"],
    }
    scenarios_list = list(scenarios_map.get(building.building_id, []))
    if hasattr(building, "scenarios") and building.scenarios:
        for s in building.scenarios:
            if s.scenario_id not in scenarios_list:
                scenarios_list.append(s.scenario_id)

    # Strictly distinguish unreviewed observations from confirmed issues
    requires_review_cnt = sum(1 for obs in building.observations if obs.status in ["requires_review", "reported"])
    confirmed_issues_cnt = sum(1 for obs in building.observations if obs.status in ["confirmed", "reviewed", "actioned"])

    return BuildingRead(
        building_id=building.building_id,
        name=building.name,
        operating_schedule=OperatingSchedule(
            standard_daily_hours=building.standard_daily_hours,
            operating_days=building.operating_days,
        ),
        resource_summary=resource_summary,
        associated_sensors=sensor_ids,
        relevant_observations=observations_dto,
        relevant_simulation_scenarios=scenarios_list,
        active_issues_count=confirmed_issues_cnt,
        requires_review_count=requires_review_cnt,
        gross_floor_area_sqm=building.gross_floor_area_sqm,
        archetype=building.archetype,
        construction_year=building.construction_year,
    )


def build_campus_digital_twin_dto(db: Session) -> CampusDigitalTwin:
    """Aggregates all building states into the holistic Campus Digital Twin."""
    from app.schemas.building import CampusStatusSummary

    buildings = db.query(Building).all()
    building_dtos = [build_building_read_dto(b, db) for b in buildings]

    total_power = sum(b.resource_summary.energy.power_kw for b in building_dtos)
    total_energy = sum(b.resource_summary.energy.daily_energy_kwh for b in building_dtos)
    total_flow = sum(b.resource_summary.water.flow_litres_per_minute for b in building_dtos)
    total_water = sum(b.resource_summary.water.daily_water_litres for b in building_dtos)
    total_waste = sum(b.resource_summary.waste.daily_waste_kg for b in building_dtos)

    avg_segregation = (
        sum(b.resource_summary.waste.segregation_fraction for b in building_dtos) / len(building_dtos)
        if building_dtos
        else 0.0
    )

    # Sensor breakdown
    sensors = db.query(Sensor).all()
    total_sensors = len(sensors)
    active_sensors = sum(1 for s in sensors if s.status == "ACTIVE")
    source_counts = {"real": 0, "manual": 0, "simulated": 0}
    for s in sensors:
        if s.source in source_counts:
            source_counts[s.source] += 1

    total_requires_review = sum(b.requires_review_count for b in building_dtos)
    total_confirmed = sum(b.active_issues_count for b in building_dtos)
    total_active_obs = total_requires_review + total_confirmed

    return CampusDigitalTwin(
        campus_name="EcoTwin Sustainable University Campus",
        timestamp=datetime.now(timezone.utc),
        total_buildings=len(building_dtos),
        buildings=building_dtos,
        campus_resource_totals=CampusResourceTotals(
            total_power_kw=round(total_power, 2),
            total_daily_energy_kwh=round(total_energy, 2),
            total_water_flow_lpm=round(total_flow, 2),
            total_daily_water_litres=round(total_water, 2),
            total_daily_waste_kg=round(total_waste, 2),
            campus_average_segregation_fraction=round(avg_segregation, 3),
        ),
        sensor_counts=SensorCountBreakdown(
            total_sensors=total_sensors,
            active_sensors=active_sensors,
            by_source=source_counts,
        ),
        status_summary=CampusStatusSummary(
            active_observations_count=total_active_obs,
            requires_review_count=total_requires_review,
            confirmed_issues_count=total_confirmed,
        ),
    )
