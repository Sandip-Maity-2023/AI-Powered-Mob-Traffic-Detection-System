import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db, get_nosql_collection
from backend.app.config import settings
from backend.app.models import Incident, AlertLog
from backend.app.schemas import FrameDetectRequest, FrameDetectResponse
from backend.app.services.vision_service import vision_service
from backend.app.services.alert_service import alert_service

router = APIRouter(prefix="/vision", tags=["Computer Vision & Violence Detection"])

@router.post("/detect-frame", response_model=FrameDetectResponse)
def detect_live_frame(
    request: FrameDetectRequest,
    db: Session = Depends(get_db)
):
    """
    Process a single live camera or webcam frame using OpenCV.
    Computes optical flow, motion kinetic energy, generates bounding boxes,
    and runs the uploaded GradientBoostingClassifier model.
    """
    try:
        result = vision_service.analyze_frame(
            image_base64=request.image_base64,
            camera_id=request.camera_id,
            run_ml_classification=request.run_ml_classification
        )

        # Log frame telemetry to NoSQL database
        nosql_frames = get_nosql_collection("vision_frame_telemetry")
        nosql_frames.insert_one({
            "camera_id": request.camera_id,
            "motion_energy": result.motion_energy,
            "optical_flow_magnitude": result.optical_flow_magnitude,
            "violence_probability": result.violence_probability,
            "severity": result.severity,
            "is_anomaly": result.is_anomaly,
            "incident": result.incident_detected,
            "timestamp": datetime.utcnow().isoformat()
        })

        # If high-confidence violence is detected, auto-record incident into relational DB
        if result.is_anomaly and result.violence_probability > 0.65:
            existing = db.query(Incident).filter(
                Incident.camera_id == request.camera_id,
                Incident.status == "active"
            ).first()
            if not existing:
                inc = Incident(
                    id=f"INC-V{uuid.uuid4().hex[:5].upper()}",
                    type=result.incident_detected or "Live Violence Anomaly",
                    location=f"Live Optical Stream ({request.camera_id})",
                    latitude=12.9716,
                    longitude=77.5946,
                    severity="critical" if result.violence_probability > 0.75 else "warning",
                    status="active",
                    camera_id=request.camera_id,
                    detector_name="OpenCV Optical Flow + GradientBoosting",
                    details=f"Autonomous Computer Vision trigger: Motion Energy {result.motion_energy}%, Violence Index {int(result.violence_probability*100)}%",
                    ai_confidence=round(result.violence_probability * 100, 1),
                    predicted_class=result.ml_prediction.predicted_class if result.ml_prediction else 6,
                    class_name=result.ml_prediction.class_name if result.ml_prediction else "Violent Physical Brawl"
                )
                db.add(inc)
                db.commit()

                # Trigger emergency alarm buzzer/siren
                alert_service.trigger_alarm_siren(inc.id)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame detection failed: {str(e)}")

@router.post("/upload-video")
async def upload_and_analyze_video(
    file: UploadFile = File(...),
    auto_create_incident: bool = Form(True),
    camera_id: str = Form("CAM-UPLOAD-01"),
    db: Session = Depends(get_db)
):
    """
    Upload an MP4 / WebM / AVI video file.
    Analyzes optical flow across sampled frames and predicts violence/incident category
    using the uploaded GradientBoostingClassifier.
    """
    save_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, save_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        analysis = vision_service.process_video_file(file_path, camera_id=camera_id)

        created_incident_id = None
        if auto_create_incident and analysis["is_violence"]:
            pred = analysis["prediction"]
            inc = Incident(
                id=f"INC-V{uuid.uuid4().hex[:5].upper()}",
                type=pred["class_name"],
                location=f"Uploaded Tactical Video ({file.filename})",
                latitude=12.9740,
                longitude=77.5980,
                severity=pred["severity"],
                status="active",
                camera_id=camera_id,
                detector_name="Video OpenCV Analyzer + GradientBoosting",
                details=f"Peak violence probability: {int(analysis['peak_violence_probability']*100)}%. {pred['explanation']}",
                ai_confidence=pred["confidence"],
                predicted_class=pred["predicted_class"],
                class_name=pred["class_name"],
                video_evidence_url=f"/uploads/{save_filename}"
            )
            db.add(inc)
            db.commit()
            db.refresh(inc)
            created_incident_id = inc.id

            # Trigger Alarm & Alert Broadcast
            alert_service.dispatch_alert(
                db=db,
                title=f"VIOLENCE DETECTED: {pred['class_name']}",
                message=f"Autonomous video inference on {file.filename} detected incident with {pred['confidence']}% AI confidence.",
                severity=pred["severity"],
                target_departments=pred["recommended_departments"],
                incident_id=inc.id,
                trigger_siren=pred["severity"] == "critical"
            )

        return {
            "success": True,
            "filename": file.filename,
            "analysis": analysis,
            "incident_logged_id": created_incident_id,
            "alarm_triggered": analysis["is_violence"] and analysis["recommended_severity"] == "critical"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video analysis failed: {str(e)}")

