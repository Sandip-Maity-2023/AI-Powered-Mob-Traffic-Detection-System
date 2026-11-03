import math
import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models import EmergencyUnit, Incident, Camera

class TrackingService:
    def __init__(self):
        pass

    def simulate_telemetry_drift(self, db: Session):
        """Simulate realistic movement drift for patrolling emergency units."""
        units = db.query(EmergencyUnit).all()
        for unit in units:
            if unit.status == "patrolling":
                # Small random waypoint drift around smart city center (approx 12.9716, 77.5946)
                d_lat = (random.random() - 0.5) * 0.0008
                d_lng = (random.random() - 0.5) * 0.0008
                unit.latitude += d_lat
                unit.longitude += d_lng
                unit.speed_kmh = round(random.uniform(25.0, 55.0), 1)
                unit.heading = round(random.uniform(0, 360), 1)
                unit.last_ping = datetime.utcnow()
            elif unit.status == "dispatched" and unit.assigned_incident_id:
                incident = db.query(Incident).filter(Incident.id == unit.assigned_incident_id).first()
                if incident:
                    # Move towards the incident
                    lat_diff = incident.latitude - unit.latitude
                    lng_diff = incident.longitude - unit.longitude
                    dist = math.sqrt(lat_diff**2 + lng_diff**2)
                    if dist > 0.0005:
                        step = min(dist, 0.0015)
                        unit.latitude += (lat_diff / dist) * step
                        unit.longitude += (lng_diff / dist) * step
                        unit.speed_kmh = round(random.uniform(55.0, 85.0), 1) # High emergency speed
                        unit.heading = round(math.degrees(math.atan2(lng_diff, lat_diff)) % 360, 1)
                    else:
                        unit.status = "on_scene"
                        unit.speed_kmh = 0.0
                    unit.last_ping = datetime.utcnow()
        db.commit()

    def dispatch_unit_to_incident(
        self, 
        db: Session, 
        unit_id: str, 
        incident_id: str
    ) -> Optional[EmergencyUnit]:
        """Assign an emergency response unit to an active incident."""
        unit = db.query(EmergencyUnit).filter(EmergencyUnit.id == unit_id).first()
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not unit or not incident:
            return None

        unit.status = "dispatched"
        unit.assigned_incident_id = incident_id
        unit.speed_kmh = 65.0
        unit.last_ping = datetime.utcnow()

        incident.status = "dispatched"
        incident.time_ago = "Dispatched just now"

        db.commit()
        db.refresh(unit)
        return unit

    def get_all_tracking_locations(self, db: Session) -> Dict[str, Any]:
        """Aggregate all real-time coordinates: cameras, incidents, and responder units."""
        self.simulate_telemetry_drift(db)

        units = db.query(EmergencyUnit).all()
        cameras = db.query(Camera).all()
        incidents = db.query(Incident).all()

        return {
            "center": {"lat": 12.9716, "lng": 77.5946}, # Smart City Central Coordinates
            "emergency_units": [
                {
                    "id": u.id,
                    "name": u.name,
                    "department": u.department,
                    "unit_type": u.unit_type,
                    "lat": u.latitude,
                    "lng": u.longitude,
                    "heading": u.heading,
                    "speed_kmh": u.speed_kmh,
                    "status": u.status,
                    "assigned_incident_id": u.assigned_incident_id,
                    "last_ping": u.last_ping.isoformat()
                }
                for u in units
            ],
            "cameras": [
                {
                    "id": c.id,
                    "name": c.name,
                    "location": c.location,
                    "sector": c.sector,
                    "lat": c.latitude,
                    "lng": c.longitude,
                    "status": c.status,
                    "ai_model": c.ai_model,
                    "fps": c.fps
                }
                for c in cameras
            ],
            "incidents": [
                {
                    "id": inc.id,
                    "type": inc.type,
                    "location": inc.location,
                    "lat": inc.latitude,
                    "lng": inc.longitude,
                    "severity": inc.severity,
                    "status": inc.status,
                    "confidence": inc.ai_confidence,
                    "time_ago": inc.time_ago,
                    "camera_id": inc.camera_id
                }
                for inc in incidents
            ]
        }

tracking_service = TrackingService()

