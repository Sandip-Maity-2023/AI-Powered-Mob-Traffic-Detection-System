from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db, get_nosql_collection
from backend.app.models import Incident, AlertLog
from backend.app.schemas import IncidentCreate, IncidentUpdate, IncidentResponse

router = APIRouter(prefix="/incidents", tags=["Incidents Management"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve all smart city incidents ordered by timestamp descending."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    return query.order_by(Incident.timestamp.desc()).limit(int(limit)).all()

@router.post("", response_model=IncidentResponse)
def create_incident(
    req: IncidentCreate,
    db: Session = Depends(get_db)
):
    """Manually or programmatically register a new incident in the relational database."""
    inc = Incident(
        type=req.type,
        location=req.location,
        latitude=req.latitude,
        longitude=req.longitude,
        severity=req.severity,
        camera_id=req.camera_id,
        detector_name=req.detector_name,
        details=req.details,
        ai_confidence=req.ai_confidence,
        predicted_class=req.predicted_class,
        class_name=req.class_name,
        video_evidence_url=req.video_evidence_url,
        status="active",
        timestamp=datetime.now(timezone.utc),
        time_ago="Just now"
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    # Replicate into NoSQL store
    nosql_coll = get_nosql_collection("incident_audit_trail")
    nosql_coll.insert_one({
        "action": "CREATE",
        "incident_id": inc.id,
        "type": inc.type,
        "location": inc.location,
        "severity": inc.severity,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return inc

@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: str,
    update: IncidentUpdate,
    db: Session = Depends(get_db)
):
    """Transition incident status (e.g. active -> dispatched -> resolved)."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if update.status:
        inc.status = update.status
        if update.status == "dispatched":
            inc.time_ago = "Dispatched 1m ago"
        elif update.status == "resolved":
            inc.time_ago = "Resolved just now"
    if update.details:
        inc.details = update.details
    if update.severity:
        inc.severity = update.severity

    db.commit()
    db.refresh(inc)
    return inc

@router.get("/stats")
def get_incident_stats(db: Session = Depends(get_db)):
    """Aggregate high-level incident metrics across the metropolitan area."""
    total = db.query(Incident).count()
    active = db.query(Incident).filter(Incident.status == "active").count()
    dispatched = db.query(Incident).filter(Incident.status == "dispatched").count()
    resolved = db.query(Incident).filter(Incident.status == "resolved").count()
    critical = db.query(Incident).filter(Incident.severity == "critical").count()
    warning = db.query(Incident).filter(Incident.severity == "warning").count()
    normal = db.query(Incident).filter(Incident.severity == "normal").count()

    return {
        "total_incidents": total,
        "active": active,
        "dispatched": dispatched,
        "resolved": resolved,
        "critical_priority": critical,
        "warning_priority": warning,
        "normal_priority": normal,
        "resolution_rate_pct": round((resolved / total * 100), 1) if total > 0 else 0
    }
