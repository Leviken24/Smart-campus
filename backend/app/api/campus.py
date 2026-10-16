"""EcoTwin AI - Campus API Router
Provides aggregated Digital Twin state for the campus.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.building import CampusDigitalTwin
from app.services.digital_twin import build_campus_digital_twin_dto

router = APIRouter(prefix="/campus", tags=["Campus Digital Twin"])


@router.get("", response_model=CampusDigitalTwin, summary="Get full Campus Digital Twin state")
def get_campus_digital_twin(db: Session = Depends(get_db)) -> CampusDigitalTwin:
    """Returns the consolidated digital twin representation of the campus,
    including all buildings, resource totals, and sensor counts.
    """
    return build_campus_digital_twin_dto(db)
