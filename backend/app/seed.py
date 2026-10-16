"""EcoTwin AI - Deterministic Database Seeder
Populates database with canonical buildings (ACADEMIC, LIB, RESIDENCE),
registered sensors, sample observations, and baseline telemetry.
Strictly preserves source classification (real, manual, simulated).
"""

import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.building import Building, BuildingObservation
from app.models.sensor import Sensor
from app.models.reading import SensorReading


def seed_database(db: Session, reset_db: bool = False) -> dict:
    """Idempotently seeds canonical campus buildings, sensors, and initial telemetry.
    If reset_db is True, cleanly wipes existing tables in dependency order and re-seeds.
    """
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    if reset_db:
        # Wipe in foreign-key dependency order
        db.query(SensorReading).delete()
        db.query(BuildingObservation).delete()
        db.query(Sensor).delete()
        db.query(Building).delete()
        try:
            from app.models.scenario import SimulationScenario
            db.query(SimulationScenario).delete()
        except Exception:
            pass
        db.commit()

    # 1. Seed Buildings
    canonical_buildings = [
        {
            "building_id": "ACADEMIC",
            "name": "Academic Block",
            "standard_daily_hours": 10.0,
            "operating_days": 30.0,
            "gross_floor_area_sqm": 12500.0,
            "archetype": "academic_facility",
            "construction_year": 2015,
        },
        {
            "building_id": "LIB",
            "name": "Library",
            "standard_daily_hours": 16.0,
            "operating_days": 30.0,
            "gross_floor_area_sqm": 8200.0,
            "archetype": "library_archive",
            "construction_year": 2018,
        },
        {
            "building_id": "RESIDENCE",
            "name": "Student Residence",
            "standard_daily_hours": 24.0,
            "operating_days": 30.0,
            "gross_floor_area_sqm": 15000.0,
            "archetype": "residential_hall",
            "construction_year": 2020,
        },
    ]

    for b_data in canonical_buildings:
        existing = db.query(Building).filter(Building.building_id == b_data["building_id"]).first()
        if not existing:
            db.add(Building(**b_data))
    db.commit()

    # 2. Seed Sensors
    sensors_spec = [
        # ACADEMIC
        {"sensor_id": "SN-ACAD-PWR-01", "building_id": "ACADEMIC", "metric": "power", "unit": "kW", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 60, "min_valid_reading": 0.0, "max_valid_reading": 500.0, "zone_id": "MAIN_FEED"},
        {"sensor_id": "SN-ACAD-ENG-01", "building_id": "ACADEMIC", "metric": "energy", "unit": "kWh", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 3600, "min_valid_reading": 0.0, "max_valid_reading": 20000.0, "zone_id": "MAIN_FEED"},
        {"sensor_id": "SN-ACAD-WTR-01", "building_id": "ACADEMIC", "metric": "water_flow", "unit": "L/min", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 60, "min_valid_reading": 0.0, "max_valid_reading": 150.0, "zone_id": "INLET_RISER"},
        {"sensor_id": "SN-ACAD-WST-01", "building_id": "ACADEMIC", "metric": "waste_weight", "unit": "kg", "source": "manual", "status": "ACTIVE", "sampling_interval_seconds": 86400, "min_valid_reading": 0.0, "max_valid_reading": 1000.0, "zone_id": "DUMPSTER_BAY"},
        
        # LIB
        {"sensor_id": "SN-LIB-PWR-01", "building_id": "LIB", "metric": "power", "unit": "kW", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 60, "min_valid_reading": 0.0, "max_valid_reading": 250.0, "zone_id": "MAIN_FEED"},
        {"sensor_id": "SN-LIB-ENG-01", "building_id": "LIB", "metric": "energy", "unit": "kWh", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 3600, "min_valid_reading": 0.0, "max_valid_reading": 10000.0, "zone_id": "MAIN_FEED"},
        {"sensor_id": "SN-LIB-WTR-01", "building_id": "LIB", "metric": "water_flow", "unit": "L/min", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 60, "min_valid_reading": 0.0, "max_valid_reading": 80.0, "zone_id": "INLET_RISER"},
        {"sensor_id": "SN-LIB-WST-01", "building_id": "LIB", "metric": "waste_weight", "unit": "kg", "source": "manual", "status": "ACTIVE", "sampling_interval_seconds": 86400, "min_valid_reading": 0.0, "max_valid_reading": 500.0, "zone_id": "RECYCLING_STATION"},
        
        # RESIDENCE
        {"sensor_id": "SN-RES-PWR-01", "building_id": "RESIDENCE", "metric": "power", "unit": "kW", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 60, "min_valid_reading": 0.0, "max_valid_reading": 350.0, "zone_id": "MAIN_FEED"},
        {"sensor_id": "SN-RES-ENG-01", "building_id": "RESIDENCE", "metric": "energy", "unit": "kWh", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 3600, "min_valid_reading": 0.0, "max_valid_reading": 15000.0, "zone_id": "MAIN_FEED"},
        {"sensor_id": "SN-RES-WTR-01", "building_id": "RESIDENCE", "metric": "water_flow", "unit": "L/min", "source": "real", "status": "ACTIVE", "sampling_interval_seconds": 60, "min_valid_reading": 0.0, "max_valid_reading": 200.0, "zone_id": "PRIMARY_SUPPLY"},
        {"sensor_id": "SN-RES-WST-01", "building_id": "RESIDENCE", "metric": "waste_weight", "unit": "kg", "source": "manual", "status": "ACTIVE", "sampling_interval_seconds": 86400, "min_valid_reading": 0.0, "max_valid_reading": 1500.0, "zone_id": "WASTE_CORRAL"},
    ]

    for s_data in sensors_spec:
        existing_s = db.query(Sensor).filter(Sensor.sensor_id == s_data["sensor_id"]).first()
        if not existing_s:
            db.add(Sensor(**s_data))
    db.commit()

    # 3. Seed Observations
    observations_spec = [
        {
            "observation_id": "OBS-ACAD-01",
            "building_id": "ACADEMIC",
            "observation_type": "energy_waste",
            "stream_type": "ENERGY",
            "status": "confirmed",
            "source": "sensor_rule",
            "summary": "HVAC scheduled ventilation operating during unoccupied Saturday hours (10:00-16:00).",
        },
        {
            "observation_id": "OBS-LIB-01",
            "building_id": "LIB",
            "observation_type": "energy_waste",
            "stream_type": "ENERGY",
            "status": "requires_review",
            "source": "image_analysis",
            "summary": "Study hall floor 2 lighting array remaining active past 23:00 curfew.",
        },
        {
            "observation_id": "OBS-RES-01",
            "building_id": "RESIDENCE",
            "observation_type": "water_leakage",
            "stream_type": "WATER",
            "status": "confirmed",
            "source": "sensor_rule",
            "summary": "Continuous 4.5 L/min washroom baseline flow detected between 02:00 and 05:00 indicating cistern leak.",
        },
        {
            "observation_id": "OBS-RES-02",
            "building_id": "RESIDENCE",
            "observation_type": "waste_accumulation",
            "stream_type": "WASTE",
            "status": "resolved",
            "source": "manual",
            "summary": "High organic waste contamination in dry-recycling bins corrected through color-coded bin sorting signs.",
        },
    ]

    for obs_data in observations_spec:
        existing_obs = db.query(BuildingObservation).filter(BuildingObservation.observation_id == obs_data["observation_id"]).first()
        if not existing_obs:
            db.add(BuildingObservation(**obs_data))
    db.commit()

    # 4. Seed Baseline Telemetry Readings
    now_utc = datetime.now(timezone.utc)
    baseline_readings = [
        # ACADEMIC
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-ACAD-PWR-01", "building_id": "ACADEMIC", "metric": "power", "value": 142.5, "unit": "kW", "timestamp": now_utc - timedelta(minutes=5), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-ACAD-ENG-01", "building_id": "ACADEMIC", "metric": "energy", "value": 1425.0, "unit": "kWh", "timestamp": now_utc - timedelta(hours=1), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-ACAD-WTR-01", "building_id": "ACADEMIC", "metric": "water_flow", "value": 18.2, "unit": "L/min", "timestamp": now_utc - timedelta(minutes=5), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-ACAD-WST-01", "building_id": "ACADEMIC", "metric": "waste_weight", "value": 420.0, "unit": "kg", "timestamp": now_utc - timedelta(hours=6), "source": "manual", "quality_status": "GOOD"},

        # LIB
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-LIB-PWR-01", "building_id": "LIB", "metric": "power", "value": 68.4, "unit": "kW", "timestamp": now_utc - timedelta(minutes=5), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-LIB-ENG-01", "building_id": "LIB", "metric": "energy", "value": 1094.4, "unit": "kWh", "timestamp": now_utc - timedelta(hours=1), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-LIB-WTR-01", "building_id": "LIB", "metric": "water_flow", "value": 6.8, "unit": "L/min", "timestamp": now_utc - timedelta(minutes=5), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-LIB-WST-01", "building_id": "LIB", "metric": "waste_weight", "value": 115.0, "unit": "kg", "timestamp": now_utc - timedelta(hours=6), "source": "manual", "quality_status": "GOOD"},

        # RESIDENCE
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-RES-PWR-01", "building_id": "RESIDENCE", "metric": "power", "value": 85.0, "unit": "kW", "timestamp": now_utc - timedelta(minutes=5), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-RES-ENG-01", "building_id": "RESIDENCE", "metric": "energy", "value": 2040.0, "unit": "kWh", "timestamp": now_utc - timedelta(hours=1), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-RES-WTR-01", "building_id": "RESIDENCE", "metric": "water_flow", "value": 32.5, "unit": "L/min", "timestamp": now_utc - timedelta(minutes=5), "source": "real", "quality_status": "GOOD"},
        {"reading_id": str(uuid.uuid4()), "sensor_id": "SN-RES-WST-01", "building_id": "RESIDENCE", "metric": "waste_weight", "value": 680.0, "unit": "kg", "timestamp": now_utc - timedelta(hours=6), "source": "manual", "quality_status": "GOOD"},
    ]

    for r_data in baseline_readings:
        existing_r = db.query(SensorReading).filter(SensorReading.sensor_id == r_data["sensor_id"]).first()
        if not existing_r:
            db.add(SensorReading(**r_data))
    db.commit()

    return {
        "buildings_seeded": len(canonical_buildings),
        "sensors_seeded": len(sensors_spec),
        "observations_seeded": len(observations_spec),
        "baseline_readings_seeded": len(baseline_readings),
    }


if __name__ == "__main__":
    db = SessionLocal()
    try:
        summary = seed_database(db)
        print("Database seeded successfully:", summary)
    finally:
        db.close()
