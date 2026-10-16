"""EcoTwin AI - Sensor ORM Model
Defines persistent entities for physical/virtual sensor instruments deployed on campus.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Sensor(Base):
    __tablename__ = "sensors"

    sensor_id = Column(String(64), primary_key=True, index=True)
    building_id = Column(String(32), ForeignKey("buildings.building_id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(String(32), nullable=False)  # power, energy, water_flow, water_volume, waste_weight
    unit = Column(String(16), nullable=False)    # kW, kWh, L/min, L, kg
    source = Column(String(16), nullable=False, default="simulated")  # real, manual, simulated
    status = Column(String(32), nullable=False, default="ACTIVE")     # ACTIVE, INACTIVE, FAULT, CALIBRATING
    sampling_interval_seconds = Column(Integer, nullable=False, default=60)
    min_valid_reading = Column(Float, nullable=False, default=0.0)
    max_valid_reading = Column(Float, nullable=True)
    zone_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    building = relationship("Building", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")
