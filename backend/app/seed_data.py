import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal, Base
from backend.app.models import Camera, Incident, EmergencyUnit, AlertLog

def seed_database():
    """Seed comprehensive initial data for Smart City Command Center."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Cameras if empty
        if db.query(Camera).count() == 0:
            cameras = [
                Camera(
                    id="CAM-802",
                    name="Nexus Parkway Overpass A90",
                    location="Sector 4, Nexus Parkway (Interstate-90)",
                    sector="Sector 4 - Commercial & Transit",
                    latitude=12.9780,
                    longitude=77.5990,
                    status="active",
                    ai_model="YOLOv8 + OpenCV Optical Flow",
                    fps=30.0
                ),
                Camera(
                    id="CAM-115",
                    name="Genesis Blvd South Junction",
                    location="Sector 1, Genesis Blvd near Plaza South",
                    sector="Sector 1 - Core Metro",
                    latitude=12.9725,
                    longitude=77.5912,
                    status="active",
                    ai_model="Road Damage R-CNN + YOLOv8",
                    fps=28.5
                ),
                Camera(
                    id="CAM-090",
                    name="Zenith Plaza Metro Terminal West",
                    location="Sector 8, Zenith Plaza Metro Station Exit",
                    sector="Sector 8 - Transit Artery",
                    latitude=12.9650,
                    longitude=77.6045,
                    status="warning",
                    ai_model="Crowd Density GCN + Violence AI",
                    fps=30.0
                ),
                Camera(
                    id="CAM-304",
                    name="Helix Alleyway Commercial Hub",
                    location="Sector 3, Helix Alleyway Smart Hub 14",
                    sector="Sector 3 - Retail District",
                    latitude=12.9690,
                    longitude=77.5850,
                    status="active",
                    ai_model="YOLOv8 Garbage Fill Level & Anomaly",
                    fps=25.0
                ),
                Camera(
                    id="CAM-WEB-01",
                    name="Operator Tactical Console Live Feed",
                    location="Sector 2, Command HQ Virtual Node",
                    sector="Sector 2 - Administrative Center",
                    latitude=12.9716,
                    longitude=77.5946,
                    status="active",
                    ai_model="GradientBoosting Classifier + OpenCV",
                    fps=30.0
                )
            ]
            db.add_all(cameras)
            db.commit()

        # 2. Seed Emergency Patrol Units if empty
        if db.query(EmergencyUnit).count() == 0:
            units = [
                EmergencyUnit(
                    id="POLICE-102",
                    name="Traffic Police Interceptor #102",
                    department="Traffic Police",
                    unit_type="Patrol Car",
                    latitude=12.9750,
                    longitude=77.5970,
                    heading=45.0,
                    speed_kmh=42.0,
                    status="patrolling"
                ),
                EmergencyUnit(
                    id="POLICE-405",
                    name="Highway Patrol Cruiser #405",
                    department="Traffic Police",
                    unit_type="Patrol Car",
                    latitude=12.9805,
                    longitude=77.6020,
                    heading=120.0,
                    speed_kmh=58.5,
                    status="patrolling"
                ),
                EmergencyUnit(
                    id="AMB-09",
                    name="Rapid Trauma Ambulance #09",
                    department="Emergency Response Teams",
                    unit_type="Rapid Ambulance",
                    latitude=12.9680,
                    longitude=77.5930,
                    heading=270.0,
                    speed_kmh=35.0,
                    status="patrolling"
                ),
                EmergencyUnit(
                    id="FIRE-14",
                    name="Urban Fire Engine & Rescue #14",
                    department="Emergency Response Teams",
                    unit_type="Fire Engine",
                    latitude=12.9620,
                    longitude=77.5890,
                    heading=180.0,
                    speed_kmh=0.0,
                    status="idle"
                ),
                EmergencyUnit(
                    id="MUNI-22",
                    name="Municipal Smart Sanitation Fleet #22",
                    department="Municipal Corporations",
                    unit_type="Sanitation Fleet",
                    latitude=12.9710,
                    longitude=77.5870,
                    heading=90.0,
                    speed_kmh=24.0,
                    status="patrolling"
                ),
                EmergencyUnit(
                    id="DRONE-03",
                    name="Surveillance & Crowd LiDAR Drone #03",
                    department="Urban Planning Departments",
                    unit_type="Surveillance Drone",
                    latitude=12.9730,
                    longitude=77.6010,
                    heading=315.0,
                    speed_kmh=48.0,
                    status="patrolling"
                ),
                EmergencyUnit(
                    id="GOV-CIVIL-01",
                    name="Gov Joint Task Force Cruiser #01",
                    department="Government Agencies",
                    unit_type="Patrol Car",
                    latitude=12.9700,
                    longitude=77.5960,
                    heading=0.0,
                    speed_kmh=30.0,
                    status="patrolling"
                )
            ]
            db.add_all(units)
            db.commit()

        # 3. Seed Incidents if empty
        if db.query(Incident).count() == 0:
            now = datetime.utcnow()
            incidents = [
                Incident(
                    id="INC-2941",
                    type="Multi-Vehicle Collision",
                    location="Sector 4, Nexus Parkway (Interstate-90)",
                    latitude=12.9780,
                    longitude=77.5990,
                    severity="critical",
                    timestamp=now - timedelta(minutes=14),
                    time_ago="14 mins ago",
                    status="dispatched",
                    camera_id="CAM-802",
                    detector_name="YOLOv8x Spatial-Object Tracker",
                    details="Collided sedan and delivery truck block left 2 lanes. Dynamic lane rerouting triggered.",
                    ai_confidence=98.7,
                    predicted_class=1,
                    class_name="Vehicle Collision & Traffic Crash"
                ),
                Incident(
                    id="INC-2940",
                    type="Pothole Edge Structural Fatigue",
                    location="Sector 1, Genesis Blvd near Plaza South",
                    latitude=12.9725,
                    longitude=77.5912,
                    severity="normal",
                    timestamp=now - timedelta(minutes=32),
                    time_ago="32 mins ago",
                    status="active",
                    camera_id="CAM-115",
                    detector_name="Road Crack & Pothole Faster R-CNN",
                    details="Structural fatigue detected measuring 48cm depth. Auto-scheduled repair dispatch within 24 hours.",
                    ai_confidence=94.6,
                    predicted_class=3,
                    class_name="Public Infrastructure Vandalism & Damage"
                ),
                Incident(
                    id="INC-2939",
                    type="Abrupt Crowd Surge & Choke Point",
                    location="Sector 8, Zenith Plaza Metro Station Exit",
                    latitude=12.9650,
                    longitude=77.6045,
                    severity="warning",
                    timestamp=now - timedelta(minutes=45),
                    time_ago="45 mins ago",
                    status="dispatched",
                    camera_id="CAM-090",
                    detector_name="CrowdFlow GCN Estimator",
                    details="Foot traffic density exceeds safety threshold of 4.2 ppl/m2. Dispatching transit crowd marshals.",
                    ai_confidence=96.3,
                    predicted_class=2,
                    class_name="Crowd Surge & Public Riot Choke Point"
                ),
                Incident(
                    id="INC-2938",
                    type="Trash Overflow & Waste Dump Anomaly",
                    location="Sector 3, Helix Alleyway Smart Hub 14",
                    latitude=12.9690,
                    longitude=77.5850,
                    severity="warning",
                    timestamp=now - timedelta(minutes=62),
                    time_ago="1 hr ago",
                    status="active",
                    camera_id="CAM-304",
                    detector_name="GarbageOverflow Mask R-CNN",
                    details="Bin volume exceeds 92%. Automated robotic compacting fleet routing triggered.",
                    ai_confidence=92.1,
                    predicted_class=3,
                    class_name="Public Infrastructure Vandalism & Damage"
                )
            ]
            db.add_all(incidents)
            db.commit()

        # 4. Seed Alerts if empty
        if db.query(AlertLog).count() == 0:
            alerts = [
                AlertLog(
                    id="ALT-8801",
                    incident_id="INC-2941",
                    title="CRITICAL: Nexus Parkway Multi-Vehicle Collision",
                    message="High-velocity impact on Interstate-90. Dispatched Traffic Police Interceptor #102 and Ambulance #09.",
                    severity="critical",
                    target_departments=json.dumps(["Traffic Police", "Emergency Response Teams"]),
                    channels=json.dumps(["AUDIO_ALARM", "SMS", "RADIO", "PUSH"]),
                    status="delivered",
                    dispatched_at=datetime.utcnow() - timedelta(minutes=13)
                ),
                AlertLog(
                    id="ALT-8802",
                    incident_id="INC-2939",
                    title="WARNING: Zenith Plaza Metro Station Crowd Surge",
                    message="Pedestrian density reached 4.5 ppl/m2. Public alert broadcasted and transit marshals routed.",
                    severity="warning",
                    target_departments=json.dumps(["Traffic Police", "Smart City Authorities"]),
                    channels=json.dumps(["SMS", "PUSH"]),
                    status="delivered",
                    dispatched_at=datetime.utcnow() - timedelta(minutes=42)
                )
            ]
            db.add_all(alerts)
            db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully with initial Smart City assets.")

