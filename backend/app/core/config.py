"""Application configuration settings for EcoTwin AI.

Loads environment variables server-side using Pydantic Settings.
Never exposes provider secrets to the frontend.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration parameters for the FastAPI backend."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core Environment
    APP_ENV: str = "development"
    PROJECT_NAME: str = "EcoTwin AI"
    VERSION: str = "1.0.0"

    # Persistence
    DATABASE_URL: str = "sqlite:///./ecotwin.db"

    # CORS & Connectivity
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # External Provider Credentials (Server-side ONLY)
    XAI_API_KEY: Optional[str] = None
    XAI_MODEL: str = "grok-beta"

    VISION_PROVIDER: str = "mock"
    VISION_API_KEY: Optional[str] = None
    VISION_MODEL: str = "waste-detection-v1"

    # Upload Constraints
    MAX_IMAGE_UPLOAD_MB: int = 8

    @property
    def is_grok_configured(self) -> bool:
        """Indicates whether a non-empty Grok API key is configured."""
        return bool(self.XAI_API_KEY and self.XAI_API_KEY.strip())

    @property
    def is_vision_configured(self) -> bool:
        """Indicates whether vision inference is configured (mock or valid key)."""
        if self.VISION_PROVIDER.lower() == "mock":
            return True
        return bool(self.VISION_API_KEY and self.VISION_API_KEY.strip())

    @property
    def cors_origins(self) -> List[str]:
        """Parsed list of allowed CORS origins."""
        return [origin.strip() for origin in self.FRONTEND_ORIGIN.split(",") if origin.strip()]


# Global cached settings instance
settings = Settings()
