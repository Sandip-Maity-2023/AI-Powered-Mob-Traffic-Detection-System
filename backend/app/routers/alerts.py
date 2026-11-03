import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import AlertLog
from backend.app.schemas import BroadcastAlertRequest, AlertResponse
from backend.app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alarms & Multi-Agency Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve historical alert logs dispatched to municipal & emergency departments."""
    alerts = db.query(AlertLog).order_by(AlertLog.dispatched_at.desc()).limit(limit).all()
    results = []
    for a in alerts:
        results.append(AlertResponse(
            id=a.id,
            incident_id=a.incident_id,
            title=a.title,
            message=a.message,
            severity=a.severity,
            target_departments=json.loads(a.target_departments) if a.target_departments else [],
            channels=json.loads(a.channels) if a.channels else [],
            status=a.status,
            dispatched_at=a.dispatched_at,
            acknowledged_by=a.acknowledged_by
        ))
    return results

@router.post("/broadcast", response_model=AlertResponse)
def broadcast_alert(
    req: BroadcastAlertRequest,
    db: Session = Depends(get_db)
):
    """
    Broadcast an emergency alert across municipal agencies and trigger command center alarms.
    Target departments include:
    - Smart City Authorities
    - Municipal Corporations
    - Traffic Police
    - Emergency Response Teams
    - Urban Planning Departments
    - Government Agencies
    """
    try:
        alert_record = alert_service.dispatch_alert(
            db=db,
            title=req.title,
            message=req.message,
            severity=req.severity,
            target_departments=req.target_departments,
            channels=req.channels,
            incident_id=req.incident_id,
            trigger_siren=req.trigger_siren
        )

        return AlertResponse(
            id=alert_record.id,
            incident_id=alert_record.incident_id,
            title=alert_record.title,
            message=alert_record.message,
            severity=alert_record.severity,
            target_departments=req.target_departments,
            channels=req.channels,
            status=alert_record.status,
            dispatched_at=alert_record.dispatched_at,
            acknowledged_by=alert_record.acknowledged_by
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Broadcast failed: {str(e)}")

@router.get("/siren-status")
def get_siren_status():
    """Check whether high-urgency acoustic alarm sirens are actively sounding."""
    return {
        "is_sounding": alert_service.is_siren_sounding,
        "active_incident_id": alert_service.active_alarm_incident_id
    }

@router.post("/trigger-siren")
def trigger_alarm_siren(incident_id: str = None):
    """Activate tactical alarm buzzer and beacon sirens."""
    alert_service.trigger_alarm_siren(incident_id)
    return {"status": "siren_activated", "sounding": True, "incident_id": incident_id}

@router.post("/silence-siren")
def silence_alarm_siren():
    """Silence active sirens upon emergency team acknowledgement."""
    alert_service.silence_alarm_siren()
    return {"status": "siren_silenced", "sounding": False}

