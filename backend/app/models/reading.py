"""EcoTwin AI - Reading and Aggregation ORM Models
Defines immutable time-series telemetry records and roll-up bucket entities.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    reading_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sensor_id = Column(String(64), ForeignKey("sensors.sensor_id", ondelete="CASCADE"), nullable=False, index=True)
    building_id = Column(String(32), ForeignKey("buildings.building_id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(String(32), nullable=False, index=True)  # power, energy, water_flow, water_volume, waste_weight
    value = Column(Float, nullable=False)
    unit = Column(String(16), nullable=False)                # kW, kWh, L/min, L, kg
    timestamp = Column(DateTime, nullable=False, index=True)
    source = Column(String(16), nullable=False)              # real, manual, simulated
    quality_status = Column(String(32), nullable=False, default="GOOD")  # GOOD, SUSPECT_SPIKE, OUT_OF_BOUNDS, INTERPOLATED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    building = relationship("Building", back_populates="readings")
    sensor = relationship("Sensor", back_populates="readings")


class AggregatedResourceBucket(Base):
    __tablename__ = "aggregated_resource_buckets"

    bucket_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id = Column(String(32), ForeignKey("buildings.building_id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(String(32), nullable=False)
    unit = Column(String(16), nullable=False)
    interval_type = Column(String(16), nullable=False)  # hourly, daily, monthly
    bucket_start_utc = Column(DateTime, nullable=False, index=True)
    bucket_end_utc = Column(DateTime, nullable=False)
    aggregated_value = Column(Float, nullable=False)
    sample_count = Column(Integer, nullable=False, default=0)
    contains_simulated = Column(Boolean, nullable=False, default=False)
    quality_status = Column(String(32), nullable=False, default="AGGREGATE_NOMINAL")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
