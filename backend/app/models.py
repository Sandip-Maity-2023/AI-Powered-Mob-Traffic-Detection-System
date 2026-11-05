import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: f"USR-{uuid.uuid4().hex[:6].upper()}")
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), default="Tactical Operator")
    role = Column(String(64), default="Field Dispatcher") # Officer, Dispatcher, Commander, Admin
    department = Column(String(128), default="Smart City Authorities")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    saved_evidences = relationship("SavedVideoEvidence", back_populates="user_rel")

class SavedVideoEvidence(Base):
    __tablename__ = "saved_video_evidences"

    id = Column(String(64), primary_key=True, default=lambda: f"EVD-{uuid.uuid4().hex[:6].upper()}")
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    title = Column(String(256), nullable=False)
    video_url = Column(String(512), nullable=False)
    violence_probability = Column(Float, default=0.0)
    severity = Column(String(32), default="normal")
    class_name = Column(String(128), default="Surveillance Clip")
    notes = Column(Text, nullable=True)
    camera_id = Column(String(64), nullable=True)
    saved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user_rel = relationship("User", back_populates="saved_evidences")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    location = Column(String(256), nullable=False)
    sector = Column(String(64), nullable=False, default="Sector 1")
    latitude = Column(Float, nullable=False, default=12.9716)
    longitude = Column(Float, nullable=False, default=77.5946)
    status = Column(String(32), default="active") # active, warning, offline
    stream_url = Column(String(256), nullable=True)
    ai_model = Column(String(128), default="CNN-LSTM + OpenCV")
    fps = Column(Float, default=30.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    incidents = relationship("Incident", back_populates="camera_rel")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, default=lambda: f"INC-{uuid.uuid4().hex[:6].upper()}")
    type = Column(String(128), nullable=False)
    location = Column(String(256), nullable=False)
    latitude = Column(Float, nullable=False, default=12.9716)
    longitude = Column(Float, nullable=False, default=77.5946)
    severity = Column(String(32), nullable=False, default="warning") # critical, warning, normal
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    time_ago = Column(String(64), default="Just now")
    status = Column(String(32), default="active") # active, dispatched, resolved
    camera_id = Column(String(64), ForeignKey("cameras.id"), nullable=True)
    detector_name = Column(String(128), default="PyTorch CNN-LSTM Violence Model")
    details = Column(Text, nullable=True)
    ai_confidence = Column(Float, default=95.0)
    predicted_class = Column(Integer, default=0)
    class_name = Column(String(128), default="Normal Activity")
    video_evidence_url = Column(String(256), nullable=True)

    camera_rel = relationship("Camera", back_populates="incidents")
    alerts = relationship("AlertLog", back_populates="incident_rel")

class EmergencyUnit(Base):
    __tablename__ = "emergency_units"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    department = Column(String(128), nullable=False) # Traffic Police, Municipal Corporation, Emergency Response Teams, Urban Planning, Government Agencies
    unit_type = Column(String(64), nullable=False) # Patrol Car, Rapid Ambulance, Fire Tender, Surveillance Drone, Sanitation Fleet
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    heading = Column(Float, default=0.0) # 0-360 degrees
    speed_kmh = Column(Float, default=0.0)
    status = Column(String(32), default="patrolling") # patrolling, dispatched, on_scene, idle
    assigned_incident_id = Column(String(64), nullable=True)
    last_ping = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(String(64), primary_key=True, default=lambda: f"ALT-{uuid.uuid4().hex[:6].upper()}")
    incident_id = Column(String(64), ForeignKey("incidents.id"), nullable=True)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(32), default="warning") # critical, warning, normal
    target_departments = Column(Text, nullable=False) # JSON list e.g. ["Traffic Police", "Emergency Response Teams"]
    channels = Column(Text, nullable=False) # JSON list e.g. ["AUDIO_ALARM", "SMS", "RADIO", "PUSH"]
    status = Column(String(32), default="delivered") # sent, delivered, acknowledged
    dispatched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    acknowledged_by = Column(String(128), nullable=True)

    incident_rel = relationship("Incident", back_populates="alerts")
