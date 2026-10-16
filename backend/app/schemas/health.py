"""Pydantic schemas for system health verification."""

from pydantic import BaseModel


class HealthProviders(BaseModel):
    """Configuration status for external AI providers."""
    grok_configured: bool
    vision_configured: bool


class HealthResponse(BaseModel):
    """Response payload for GET /api/health."""
    status: str
    version: str
    timestamp: str
    database: str
    providers: HealthProviders
