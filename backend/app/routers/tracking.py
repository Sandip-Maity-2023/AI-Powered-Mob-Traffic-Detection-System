from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import EmergencyUnit
from backend.app.schemas import EmergencyUnitResponse, DispatchUnitRequest
from backend.app.services.tracking_service import tracking_service

router = APIRouter(prefix="/tracking", tags=["Live Location & GPS Fleet Tracking"])

@router.get("/locations")
def get_all_locations(db: Session = Depends(get_db)):
    """
    Retrieve live GPS coordinate layers for Smart City interactive map:
    - CCTV & Tactical camera coordinates
    - Active incident locations with severity levels
    - Emergency responder units (Police, Ambulance, Fire, Drones) with live telemetry drift
    """
    return tracking_service.get_all_tracking_locations(db)

@router.get("/units", response_model=List[EmergencyUnitResponse])
def get_units(
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all emergency fleet units with coordinates and dispatch status."""
    query = db.query(EmergencyUnit)
    if department:
        query = query.filter(EmergencyUnit.department == department)
    if status:
        query = query.filter(EmergencyUnit.status == status)
    return query.all()

@router.post("/dispatch-unit", response_model=EmergencyUnitResponse)
def dispatch_unit(
    req: DispatchUnitRequest,
    db: Session = Depends(get_db)
):
    """Dispatch an emergency patrol unit to an active incident location."""
    unit = tracking_service.dispatch_unit_to_incident(
        db=db,
        unit_id=req.unit_id,
        incident_id=req.incident_id
    )
    if not unit:
        raise HTTPException(
            status_code=404, 
            detail="Unit or Incident not found"
        )
    return unit
