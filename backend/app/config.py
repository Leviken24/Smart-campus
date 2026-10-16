"""EcoTwin AI - Configuration Module
Provides centralized runtime configuration for backend data persistence,
database connection, and telemetry settings.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "ecotwin.db"


class Settings:
    PROJECT_NAME: str = "EcoTwin AI — Digital Twin, Sensor & Deterministic Simulation Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Environment & Host
    APP_ENV: str = os.getenv("APP_ENV", "development")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    
    # SQLite / PostgreSQL Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")
    
    # xAI Grok API Configuration (Backend-only)
    XAI_API_KEY: str = os.getenv("XAI_API_KEY", "")
    XAI_MODEL: str = os.getenv("XAI_MODEL", "grok-beta")
    
    # Dedicated Computer Vision Provider Configuration (Backend-only)
    VISION_PROVIDER: str = os.getenv("VISION_PROVIDER", "mock")
    VISION_API_KEY: str = os.getenv("VISION_API_KEY", "")
    VISION_MODEL: str = os.getenv("VISION_MODEL", "waste-detection-v1")
    
    # Upload Constraints
    MAX_IMAGE_UPLOAD_MB: int = int(os.getenv("MAX_IMAGE_UPLOAD_MB", "8"))
    
    # Validation and Operational Envelopes
    ALLOWED_BUILDING_IDS: set[str] = {"ACADEMIC", "LIB", "RESIDENCE"}
    ALLOWED_SOURCES: set[str] = {"real", "manual", "simulated"}
    ALLOWED_METRICS: set[str] = {"power", "energy", "water_flow", "water_volume", "waste_weight"}
    ALLOWED_UNITS: set[str] = {"kW", "kWh", "L/min", "L", "kg"}
    
    METRIC_UNIT_MAP: dict[str, str] = {
        "power": "kW",
        "energy": "kWh",
        "water_flow": "L/min",
        "water_volume": "L",
        "waste_weight": "kg",
    }
    
    # Envelope bounds (PROPOSED for warnings/quality flags)
    SENSOR_ENVELOPES: dict[str, tuple[float, float]] = {
        "power": (0.0, 1000.0),       # kW
        "energy": (0.0, 50000.0),     # kWh
        "water_flow": (0.0, 500.0),   # L/min
        "water_volume": (0.0, 100000.0), # L
        "waste_weight": (0.0, 2000.0) # kg
    }

    @property
    def cors_origins(self) -> list[str]:
        origins = [self.FRONTEND_ORIGIN]
        if self.APP_ENV == "development":
            origins.extend(["http://localhost:5173", "http://127.0.0.1:5173", "*"])
        return origins

    @property
    def is_grok_configured(self) -> bool:
        return bool(self.XAI_API_KEY and self.XAI_API_KEY.strip())

    @property
    def is_vision_configured(self) -> bool:
        if self.VISION_PROVIDER == "mock":
            return True
        return bool(self.VISION_API_KEY and self.VISION_API_KEY.strip())


settings = Settings()
