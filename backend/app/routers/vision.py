import os
import shutil
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db, get_nosql_collection
from backend.app.config import settings
from backend.app.models import Incident, AlertLog, User, SavedVideoEvidence
from backend.app.schemas import FrameDetectRequest, FrameDetectResponse
from backend.app.services.vision_service import vision_service
from backend.app.services.alert_service import alert_service
from backend.app.services.pytorch_violence_service import pytorch_violence_service
from backend.app.services.auth_service import get_current_user, get_optional_user

router = APIRouter(prefix="/vision", tags=["Computer Vision & Violence Detection"])

class SaveEvidenceRequest(BaseModel):
    title: str
    video_url: str
    violence_probability: float
    severity: str = "warning"
    class_name: str = "Violent Altercation"
    notes: Optional[str] = None
    camera_id: Optional[str] = "CAM-SAVED-EDGE"

@router.post("/detect-frame", response_model=FrameDetectResponse)
def detect_live_frame(
    request: FrameDetectRequest,
    db: Session = Depends(get_db)
):
    """
    Process live camera or webcam frame using OpenCV and PyTorch CNN-LSTM (best_violence_model.pth).
    Computes optical flow, motion energy, and CNN-LSTM violence probability across temporal sequence.
    """
    try:
        # 1. OpenCV spatial & motion analysis
        result = vision_service.analyze_frame(
            image_base64=request.image_base64,
            camera_id=request.camera_id,
            run_ml_classification=request.run_ml_classification
        )

        # 2. PyTorch MobileNetV2 + CNN-LSTM inference on temporal sequence
        img = vision_service._decode_image(request.image_base64)
        pytorch_res = None
        if img is not None:
            pytorch_res = pytorch_violence_service.predict_frame_sequence(request.camera_id, img)
            
            # Combine vision indicators with PyTorch prediction
            if pytorch_res["is_violence"]:
                result.is_anomaly = True
                result.violence_probability = max(result.violence_probability, pytorch_res["violence_probability"])
                result.severity = pytorch_res["severity"]
                result.incident_detected = pytorch_res["class_name"]

        # Log frame telemetry to NoSQL database
        nosql_frames = get_nosql_collection("vision_frame_telemetry")
        nosql_frames.insert_one({
            "camera_id": request.camera_id,
            "motion_energy": result.motion_energy,
            "optical_flow_magnitude": result.optical_flow_magnitude,
            "violence_probability": result.violence_probability,
            "pytorch_violence_prob": pytorch_res["violence_probability"] if pytorch_res else None,
            "severity": result.severity,
            "is_anomaly": result.is_anomaly,
            "incident": result.incident_detected,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Auto-record incident if high-confidence violence is detected
        if result.is_anomaly and result.violence_probability > 0.65:
            # Validate camera_id foreign key
            cam_exists = db.query(Camera).filter(Camera.id == request.camera_id).first()
            valid_cam_id = request.camera_id if cam_exists else None

            existing = db.query(Incident).filter(
                Incident.camera_id == valid_cam_id,
                Incident.status == "active"
            ).first() if valid_cam_id else None

            if not existing:
                inc = Incident(
                    id=f"INC-V{uuid.uuid4().hex[:5].upper()}",
                    type=result.incident_detected or "Live Violence Anomaly",
                    location=f"Live Optical Stream ({request.camera_id})",
                    latitude=12.9716,
                    longitude=77.5946,
                    severity="critical" if result.violence_probability > 0.75 else "warning",
                    status="active",
                    camera_id=valid_cam_id,
                    detector_name="PyTorch MobileNetV2 + CNN-LSTM (best_violence_model.pth)",
                    details=f"Violence detected with {int(result.violence_probability*100)}% probability. Motion Energy: {result.motion_energy}%",
                    ai_confidence=round(result.violence_probability * 100, 1),
                    predicted_class=6 if result.violence_probability > 0.75 else 1,
                    class_name=result.incident_detected or "Violent Physical Brawl"
                )
                db.add(inc)
                db.commit()

                if result.severity == "critical":
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
    Runs PyTorch MobileNetV2 + CNN-LSTM inference (best_violence_model.pth)
    with OpenCV optical flow motion analysis.
    """
    save_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, save_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. PyTorch CNN-LSTM Violence Model Prediction (from t1.py)
        pytorch_analysis = pytorch_violence_service.predict_video_file(file_path)

        # 2. OpenCV Optical Flow & Motion Analysis
        cv_analysis = vision_service.process_video_file(file_path, camera_id=camera_id)

        # Gold standard decision from PyTorch MobileNetV2 + CNN-LSTM model
        violence_prob = pytorch_analysis["violence_probability"]
        is_violence = pytorch_analysis["is_violence"]
        severity = pytorch_analysis["severity"]
        class_name = pytorch_analysis["class_name"]

        created_incident_id = None
        if auto_create_incident and is_violence:
            # Validate camera_id to ensure foreign key integrity
            cam_exists = db.query(Camera).filter(Camera.id == camera_id).first()
            valid_cam_id = camera_id if cam_exists else None

            inc = Incident(
                id=f"INC-V{uuid.uuid4().hex[:5].upper()}",
                type=class_name,
                location=f"Uploaded Tactical Video ({file.filename})",
                latitude=12.9740,
                longitude=77.5980,
                severity=severity,
                status="active",
                camera_id=valid_cam_id,
                detector_name="MobileNetV2 + CNN-LSTM (best_violence_model.pth)",
                details=f"{pytorch_analysis.get('alert_message', 'Violence detected')} Model confidence: {pytorch_analysis.get('confidence', 95.0)}%.",
                ai_confidence=pytorch_analysis.get("confidence", 95.0),
                predicted_class=6 if severity == "critical" else 1,
                class_name=class_name,
                video_evidence_url=f"/uploads/{save_filename}"
            )
            db.add(inc)
            db.commit()
            db.refresh(inc)
            created_incident_id = inc.id

            # Trigger Alarm & Multi-Agency Dispatch
            alert_service.dispatch_alert(
                db=db,
                title=f"VIOLENCE DETECTED: {class_name}",
                message=f"Autonomous CNN-LSTM inference on {file.filename} detected violence with {int(violence_prob*100)}% confidence.",
                severity=severity,
                target_departments=pytorch_analysis["target_departments"],
                incident_id=inc.id,
                trigger_siren=(severity == "critical")
            )

        return {
            "success": True,
            "filename": file.filename,
            "video_url": f"/uploads/{save_filename}",
            "pytorch_violence": pytorch_analysis,
            "analysis": cv_analysis,
            "motion_analysis": {
                "average_motion_energy": cv_analysis.get("average_motion_energy", 20.0),
                "peak_violence_probability": cv_analysis.get("peak_violence_probability", 0.2),
                "duration_sec": pytorch_analysis.get("duration_sec", 3.0),
                "total_frames": cv_analysis.get("total_frames", 90)
            },
            "is_violence": is_violence,
            "violence_probability": violence_prob,
            "severity": severity,
            "class_name": class_name,
            "incident_logged_id": created_incident_id,
            "alarm_triggered": (is_violence and severity == "critical")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video analysis failed: {str(e)}")

# ============================================================
# PROTECTED ACTION: Save Video Evidence (Requires JSON Web Token)
# ============================================================
@router.post("/save-video-evidence")
def save_video_evidence(
    req: SaveEvidenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    PROTECTED ENDPOINT: Requires valid JSON Web Token (Bearer Auth).
    Persists analyzed video clip, violence telemetry, and investigator notes
    associated with the authenticated officer's account.
    """
    evidence = SavedVideoEvidence(
        user_id=current_user.id,
        title=req.title,
        video_url=req.video_url,
        violence_probability=req.violence_probability,
        severity=req.severity,
        class_name=req.class_name,
        notes=req.notes or f"Saved by {current_user.full_name} ({current_user.role})",
        camera_id=req.camera_id
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return {
        "success": True,
        "evidence_id": evidence.id,
        "title": evidence.title,
        "saved_by": current_user.username,
        "saved_at": evidence.saved_at.isoformat(),
        "message": "Video evidence successfully archived to secure database ledger."
    }

@router.get("/saved-evidences")
def list_saved_evidences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve archived video evidences saved by the authenticated officer."""
    records = db.query(SavedVideoEvidence).filter(
        SavedVideoEvidence.user_id == current_user.id
    ).order_by(SavedVideoEvidence.saved_at.desc()).all()
    return records
