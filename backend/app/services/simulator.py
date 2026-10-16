"""EcoTwin AI - Telemetry Simulator Service
Generates synthetic, deterministic time-series telemetry.
CRITICAL MANDATE: All generated readings MUST permanently carry source: "simulated".
"""

import math
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.sensor import Sensor
from app.models.reading import SensorReading


def generate_simulated_readings_for_building(
    db: Session,
    building_id: Optional[str] = None,
    duration_hours: int = 24,
    sampling_interval_seconds: int = 3600,
) -> list[SensorReading]:
    """Generates synthetic time-series readings for registered sensors.
    
    All created readings are tagged with source='simulated'.
    """
    query = db.query(Sensor)
    if building_id:
        query = query.filter(Sensor.building_id == building_id)
    
    sensors = query.all()
    if not sensors:
        return []

    now_utc = datetime.now(timezone.utc)
    start_time = now_utc - timedelta(hours=duration_hours)
    step_seconds = max(60, sampling_interval_seconds)
    total_steps = int((duration_hours * 3600) / step_seconds)

    created_readings: list[SensorReading] = []

    for step in range(total_steps):
        current_ts = start_time + timedelta(seconds=step * step_seconds)
        hour = current_ts.hour

        # Diurnal solar/activity factor (peaks at 14:00, lowest at 03:00)
        diurnal_factor = 0.5 + 0.5 * math.sin(math.pi * (hour - 6) / 12) if 6 <= hour <= 18 else 0.35

        for sensor in sensors:
            # Generate deterministic synthetic value based on sensor metric and building
            base_value = 0.0
            if sensor.metric == "power":
                # Academic peaks during day, residence peaks evening/morning
                if sensor.building_id == "ACADEMIC":
                    base_value = 80.0 + 120.0 * diurnal_factor
                elif sensor.building_id == "LIB":
                    base_value = 40.0 + 50.0 * diurnal_factor
                else:  # RESIDENCE
                    res_factor = 0.8 if (6 <= hour <= 9 or 18 <= hour <= 23) else 0.3
                    base_value = 30.0 + 60.0 * res_factor

            elif sensor.metric == "energy":
                # Cumulative energy step (power * step_hours)
                power_est = 100.0 * diurnal_factor
                base_value = power_est * (step_seconds / 3600.0)

            elif sensor.metric == "water_flow":
                # Flow rate in L/min
                if sensor.building_id == "RESIDENCE":
                    res_flow = 25.0 if (7 <= hour <= 9 or 19 <= hour <= 22) else 4.0
                    base_value = res_flow
                else:
                    base_value = 12.0 * diurnal_factor

            elif sensor.metric == "water_volume":
                # Accumulated litres in this interval
                base_value = 10.0 * 60.0 * (step_seconds / 3600.0)

            elif sensor.metric == "waste_weight":
                # Dumpster reading (kg) logged at specific hours (e.g., 08:00 and 17:00)
                if hour in (8, 17):
                    base_value = 45.0 if sensor.building_id == "ACADEMIC" else 30.0
                else:
                    base_value = 0.0

            reading = SensorReading(
                reading_id=str(uuid.uuid4()),
                sensor_id=sensor.sensor_id,
                building_id=sensor.building_id,
                metric=sensor.metric,
                value=round(base_value, 2),
                unit=sensor.unit,
                timestamp=current_ts,
                source="simulated",  # STRICT MANDATE: Never 'real' or 'manual'
                quality_status="GOOD",
            )
            created_readings.append(reading)

    db.add_all(created_readings)
    db.commit()
    return created_readings
