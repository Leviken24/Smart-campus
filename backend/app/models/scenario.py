"""EcoTwin AI - Simulation Scenario ORM Model
Defines persistent entities for deterministic simulation scenario evaluations.
Ensures full auditability, baseline isolation, and permanent 'simulated' provenance.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    scenario_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id = Column(String(32), ForeignKey("buildings.building_id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_name = Column(String(128), nullable=False)
    resource_stream = Column(String(32), nullable=False, index=True)  # ENERGY, WATER, WASTE
    calculation_method = Column(String(64), nullable=False)           # deterministic_energy_v1, etc.
    calculation_version = Column(String(16), nullable=False, default="1.0.0")

    # Structured snapshots stored as JSON text to preserve complete calculation context
    baseline_values = Column(Text, nullable=False)
    scenario_parameters = Column(Text, nullable=False)
    projected_values = Column(Text, nullable=False)

    # Comparison metrics
    absolute_difference = Column(Float, nullable=False)
    percentage_difference = Column(Float, nullable=True)
    unit = Column(String(16), nullable=False)  # kWh, L, kg
    calculation_status = Column(String(32), nullable=False, default="VALID")  # VALID, UNDEFINED_ZERO_BASELINE, NEGATIVE_REDUCTION

    # Cost & Emissions (nullable if tariffs/factors unconfigured)
    cost_saved = Column(Float, nullable=True)
    emissions_avoided_kg_co2e = Column(Float, nullable=True)

    # Strict provenance metadata
    source = Column(String(16), nullable=False, default="simulated")  # ALWAYS 'simulated'
    is_projection = Column(Boolean, nullable=False, default=True)      # ALWAYS True
    assumptions = Column(Text, nullable=True)
    created_by = Column(String(64), nullable=False, default="system")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationship
    building = relationship("Building", back_populates="scenarios")
