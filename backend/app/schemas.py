from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# ----------------- Incident Schemas -----------------
class IncidentBase(BaseModel):
    type: str
    location: str
    latitude: float
    longitude: float
    severity: str = "warning" # critical, warning, normal
    camera_id: Optional[str] = None
    detector_name: str = "GradientBoosting AI"
    details: Optional[str] = None
    ai_confidence: float = 95.0
    predicted_class: int = 0
    class_name: str = "Normal Activity"
    video_evidence_url: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    status: Optional[str] = None # active, dispatched, resolved
    details: Optional[str] = None
    severity: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: str
    timestamp: datetime
    time_ago: str
    status: str

    class Config:
        from_attributes = True

# ----------------- Camera Schemas -----------------
class CameraResponse(BaseModel):
    id: str
    name: str
    location: str
    sector: str
    latitude: float
    longitude: float
    status: str
    stream_url: Optional[str]
    ai_model: str
    fps: float

    class Config:
        from_attributes = True

# ----------------- Emergency Unit (Location Tracking) Schemas -----------------
class EmergencyUnitResponse(BaseModel):
    id: str
    name: str
    department: str
    unit_type: str
    latitude: float
    longitude: float
    heading: float
    speed_kmh: float
    status: str
    assigned_incident_id: Optional[str] = None
    last_ping: datetime

    class Config:
        from_attributes = True

class DispatchUnitRequest(BaseModel):
    unit_id: str
    incident_id: str

# ----------------- Alert & Alarm Schemas -----------------
class BroadcastAlertRequest(BaseModel):
    incident_id: Optional[str] = None
    title: str
    message: str
    severity: str = "warning" # critical, warning, normal
    target_departments: List[str] = Field(
        default=["Traffic Police", "Emergency Response Teams", "Smart City Authorities"]
    )
    channels: List[str] = Field(
        default=["AUDIO_ALARM", "SMS", "PUSH_NOTIFICATION"]
    )
    trigger_siren: bool = True

class AlertResponse(BaseModel):
    id: str
    incident_id: Optional[str]
    title: str
    message: str
    severity: str
    target_departments: List[str]
    channels: List[str]
    status: str
    dispatched_at: datetime
    acknowledged_by: Optional[str]

    class Config:
        from_attributes = True

# ----------------- AI Model Prediction Schemas -----------------
class ModelPredictRequest(BaseModel):
    # The 18 features expected by gradient_boosting_model.pkl
    is_youtube: float = 0.0
    filename_len: float = 25.0
    underscore_count: float = 2.0
    duration_log: float = 2.5
    duration_short: float = 0.0
    duration_medium: float = 1.0
    duration_long: float = 0.0
    has_timestamp: float = 1.0
    filename_words: float = 4.0
    is_full_video: float = 1.0
    label_severity: float = 1.0
    is_multi_violence: float = 0.0
    path_depth: float = 2.0
    triple_underscore: float = 0.0
    has_movie_year: float = 0.0
    clip_index: float = 1.0
    dur_vs_class_mean: float = 1.0
    is_train_split: float = 0.0

class ModelPredictResponse(BaseModel):
    predicted_class: int
    class_name: str
    is_violence: bool
    confidence: float
    severity: str
    probabilities: Dict[str, float]
    explanation: str
    features_used: List[str]
    recommended_departments: List[str]

# ----------------- Computer Vision Frame Schemas -----------------
class BoundingBox(BaseModel):
    label: str
    confidence: float
    x: int
    y: int
    width: int
    height: int

class FrameDetectRequest(BaseModel):
    image_base64: str # data:image/jpeg;base64,...
    camera_id: Optional[str] = "CAM-WEB-01"
    run_ml_classification: bool = True

class FrameDetectResponse(BaseModel):
    camera_id: str
    timestamp: str
    motion_energy: float
    optical_flow_magnitude: float
    violence_probability: float
    is_anomaly: bool
    incident_detected: Optional[str]
    severity: str
    bounding_boxes: List[BoundingBox]
    annotated_image: Optional[str] # base64 image with overlays
    ml_prediction: Optional[ModelPredictResponse] = None

