"""EcoTwin AI - Building and Observation ORM Models
Defines persistent entities for physical campus buildings and field observations.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Building(Base):
    __tablename__ = "buildings"

    building_id = Column(String(32), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    standard_daily_hours = Column(Float, nullable=False, default=12.0)
    operating_days = Column(Float, nullable=False, default=30.0)
    gross_floor_area_sqm = Column(Float, nullable=True)
    archetype = Column(String(64), nullable=True)
    construction_year = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sensors = relationship("Sensor", back_populates="building", cascade="all, delete-orphan")
    readings = relationship("SensorReading", back_populates="building", cascade="all, delete-orphan")
    observations = relationship("BuildingObservation", back_populates="building", cascade="all, delete-orphan")
    scenarios = relationship("SimulationScenario", back_populates="building", cascade="all, delete-orphan")


class BuildingObservation(Base):
    __tablename__ = "building_observations"

    observation_id = Column(String(64), primary_key=True, index=True)
    building_id = Column(String(32), ForeignKey("buildings.building_id", ondelete="CASCADE"), nullable=False, index=True)
    observation_type = Column(String(64), nullable=False, default="waste_accumulation")  # waste_accumulation, water_leakage, energy_waste, etc.
    stream_type = Column(String(32), nullable=True)  # ENERGY, WATER, WASTE (backward compatibility)
    status = Column(String(32), nullable=False, default="requires_review")  # requires_review, confirmed, dismissed, resolved
    source = Column(String(32), nullable=False, default="image_analysis")  # image_analysis, sensor_rule, manual
    summary = Column(Text, nullable=False)
    image_url = Column(String(256), nullable=True)
    provider_metadata = Column(Text, nullable=True)  # Optional JSON string for CV model / detections
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_note = Column(Text, nullable=True)

    # Relationship
    building = relationship("Building", back_populates="observations")

    @property
    def description(self) -> str:
        return self.summary

    @description.setter
    def description(self, value: str):
        self.summary = value
