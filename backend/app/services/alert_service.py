import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models import AlertLog, Incident
from backend.app.database import get_nosql_collection

logger = logging.getLogger("sentracity.alert_service")

class AlertService:
    def __init__(self):
        # In-memory siren and active alarms state
        self.is_siren_sounding = False
        self.active_alarm_incident_id: Optional[str] = None
        self.recent_broadcasts: List[Dict[str, Any]] = []

    def trigger_alarm_siren(self, incident_id: Optional[str] = None) -> bool:
        """Trigger high-urgency acoustic and visual siren across command center."""
        self.is_siren_sounding = True
        self.active_alarm_incident_id = incident_id
        logger.warning(f"EMERGENCY AUDIO SIREN TRIGGERED FOR INCIDENT: {incident_id}")
        return True

    def silence_alarm_siren(self) -> bool:
        """Silence active sirens upon operator authorization."""
        self.is_siren_sounding = False
        self.active_alarm_incident_id = None
        logger.info("Emergency sirens silenced by operator.")
        return True

    def dispatch_alert(
        self,
        db: Session,
        title: str,
        message: str,
        severity: str = "warning",
        target_departments: List[str] = None,
        channels: List[str] = None,
        incident_id: Optional[str] = None,
        trigger_siren: bool = False
    ) -> AlertLog:
        """Create a durable alert record and dispatch across selected communication channels."""
        if target_departments is None:
            target_departments = ["Traffic Police", "Emergency Response Teams", "Smart City Authorities"]
        if channels is None:
            channels = ["AUDIO_ALARM", "SMS", "PUSH_NOTIFICATION"]

        if trigger_siren or severity == "critical":
            self.trigger_alarm_siren(incident_id)

        # 1. Save ACID record in Relational Database
        alert_record = AlertLog(
            incident_id=incident_id,
            title=title,
            message=message,
            severity=severity,
            target_departments=json.dumps(target_departments),
            channels=json.dumps(channels),
            status="delivered",
            dispatched_at=datetime.utcnow()
        )
        db.add(alert_record)
        db.commit()
        db.refresh(alert_record)

        # 2. Duplicate log into NoSQL store for durable telemetry streaming
        try:
            nosql_coll = get_nosql_collection("alert_telemetry")
            nosql_coll.insert_one({
                "alert_id": alert_record.id,
                "incident_id": incident_id,
                "title": title,
                "message": message,
                "severity": severity,
                "departments": target_departments,
                "channels": channels,
                "dispatched_at": datetime.utcnow().isoformat(),
                "simulated_sms_receipts": [f"+1-555-ALERT-{i}" for i in range(len(target_departments))]
            })
        except Exception as e:
            logger.error(f"Error persisting alert to NoSQL: {e}")

        # Keep in-memory ring buffer
        self.recent_broadcasts.insert(0, {
            "id": alert_record.id,
            "title": title,
            "message": message,
            "severity": severity,
            "departments": target_departments,
            "channels": channels,
            "timestamp": datetime.utcnow().isoformat()
        })
        if len(self.recent_broadcasts) > 50:
            self.recent_broadcasts.pop()

        return alert_record

alert_service = AlertService()

