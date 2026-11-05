from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db, get_database_health
from backend.app.models import EmergencyUnit, Incident, Camera, AlertLog
from backend.app.services.model_service import model_service

router = APIRouter(prefix="/system", tags=["System Health & Database Integrity"])

@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    """
    Check overall system integrity, verifying:
    1. Relational Database ACID consistency & WAL durability mode
    2. NoSQL Document Store connection
    3. GradientBoostingClassifier machine learning model inference readiness
    4. Asset entity counts across smart city sectors
    """
    db_health = get_database_health()

    camera_count = db.query(Camera).count()
    incident_count = db.query(Incident).count()
    unit_count = db.query(EmergencyUnit).count()
    alert_count = db.query(AlertLog).count()

    return {
        "status": "OPERATIONAL_NOMINAL",
        "service": "SentraCity AI Command Engine",
        "version": "4.2.0-PROD",
        "databases": db_health,
        "ai_engine": {
            "model_type": "GradientBoostingClassifier (Violence & Incident Classification)",
            "status": "READY" if model_service.model is not None else "DEGRADED",
            "features_dimension": 18,
            "classes_dimension": 7,
            "model_path": model_service.model_path
        },
        "fleet_and_nodes": {
            "monitored_cameras": camera_count,
            "recorded_incidents": incident_count,
            "active_patrol_units": unit_count,
            "alert_dispatches": alert_count
        }
    }

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """List all authorized departments and active fleet deployments."""
    departments = [
        "Smart City Authorities",
        "Municipal Corporations",
        "Traffic Police",
        "Emergency Response Teams",
        "Urban Planning Departments",
        "Government Agencies"
    ]
    summary = []
    for dept in departments:
        units = db.query(EmergencyUnit).filter(EmergencyUnit.department == dept).all()
        summary.append({
            "name": dept,
            "total_units": len(units),
            "active_patrolling": sum(1 for u in units if u.status == "patrolling"),
            "dispatched": sum(1 for u in units if u.status == "dispatched")
        })
    return summary

