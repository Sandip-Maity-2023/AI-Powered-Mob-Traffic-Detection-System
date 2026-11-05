import os
import logging
import joblib
import numpy as np
from typing import Dict, Any, List
from backend.app.config import settings
from backend.app.schemas import ModelPredictRequest, ModelPredictResponse

logger = logging.getLogger("sentracity.model_service")

# Class label mappings based on model training schema
CLASS_METADATA = {
    0: {
        "name": "Normal Surveillance Feed (Non-Violence)",
        "is_violence": False,
        "severity": "normal",
        "description": "Routine urban pedestrian and vehicular activity within normal safety limits.",
        "departments": ["Smart City Authorities"]
    },
    1: {
        "name": "Vehicle Collision & Traffic Crash",
        "is_violence": True,
        "severity": "critical",
        "description": "High-impact collision detected involving motor vehicles or roadway transit.",
        "departments": ["Traffic Police", "Emergency Response Teams"]
    },
    2: {
        "name": "Crowd Surge & Public Riot Choke Point",
        "is_violence": True,
        "severity": "critical",
        "description": "Rapid escalation of crowd density with chaotic dispersal motion indicators.",
        "departments": ["Traffic Police", "Emergency Response Teams", "Smart City Authorities"]
    },
    3: {
        "name": "Public Infrastructure Vandalism & Damage",
        "is_violence": True,
        "severity": "warning",
        "description": "Hostile tampering with city utilities, smart waste bins, or street barriers.",
        "departments": ["Municipal Corporations", "Urban Planning Departments"]
    },
    4: {
        "name": "Street Robbery & Snatching Anomaly",
        "is_violence": True,
        "severity": "warning",
        "description": "Sudden snatch-and-flee trajectory or suspicious confrontation pattern detected.",
        "departments": ["Traffic Police", "Government Agencies"]
    },
    5: {
        "name": "Weapon Threat & Armed Hostility",
        "is_violence": True,
        "severity": "critical",
        "description": "Dangerous tactical threat detected with active aggression and weapon signatures.",
        "departments": ["Emergency Response Teams", "Traffic Police"]
    },
    6: {
        "name": "Violent Physical Brawl & Assault",
        "is_violence": True,
        "severity": "critical",
        "description": "Physical combat, striking motions, or multiple-person assault in progress.",
        "departments": ["Emergency Response Teams", "Traffic Police"]
    }
}

FEATURE_ORDER = [
    'is_youtube', 'filename_len', 'underscore_count', 'duration_log',
    'duration_short', 'duration_medium', 'duration_long', 'has_timestamp',
    'filename_words', 'is_full_video', 'label_severity', 'is_multi_violence',
    'path_depth', 'triple_underscore', 'has_movie_year', 'clip_index',
    'dur_vs_class_mean', 'is_train_split'
]

class ModelService:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or settings.ML_MODEL_PATH
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded GradientBoostingClassifier model from {self.model_path}")
            else:
                logger.warning(f"Model file not found at {self.model_path}. Will attempt fallback.")
        except Exception as e:
            logger.error(f"Error loading model from {self.model_path}: {e}")

    def predict_from_features(self, req: ModelPredictRequest) -> ModelPredictResponse:
        """Run inference using the loaded GradientBoostingClassifier on the 18 feature vector."""
        feats = [
            float(req.is_youtube),
            float(req.filename_len),
            float(req.underscore_count),
            float(req.duration_log),
            float(req.duration_short),
            float(req.duration_medium),
            float(req.duration_long),
            float(req.has_timestamp),
            float(req.filename_words),
            float(req.is_full_video),
            float(req.label_severity),
            float(req.is_multi_violence),
            float(req.path_depth),
            float(req.triple_underscore),
            float(req.has_movie_year),
            float(req.clip_index),
            float(req.dur_vs_class_mean),
            float(req.is_train_split),
        ]
        X = np.array([feats], dtype=np.float64)

        if self.model is not None:
            pred_class = int(self.model.predict(X)[0])
            probas = self.model.predict_proba(X)[0]
        else:
            # Fallback heuristic if model is not loaded
            pred_class = 6 if req.label_severity > 2 else 0
            probas = [0.1] * 7
            probas[pred_class] = 0.85

        meta = CLASS_METADATA.get(pred_class, CLASS_METADATA[0])
        prob_dict = {
            f"Class {i} ({CLASS_METADATA.get(i, {}).get('name', 'Unknown')})": round(float(probas[i]), 4)
            for i in range(len(probas))
        }

        conf_pct = round(float(probas[pred_class]) * 100, 2)
        
        return ModelPredictResponse(
            predicted_class=pred_class,
            class_name=meta["name"],
            is_violence=meta["is_violence"],
            confidence=conf_pct,
            severity=meta["severity"],
            probabilities=prob_dict,
            explanation=meta["description"],
            features_used=FEATURE_ORDER,
            recommended_departments=meta["departments"]
        )

    def extract_features_from_video_meta(
        self, 
        filename: str, 
        duration_sec: float, 
        motion_energy: float, 
        violence_signal: float
    ) -> ModelPredictRequest:
        """Extract the 18 model features from video metadata and vision motion indicators."""
        fname = os.path.basename(filename)
        fname_no_ext = os.path.splitext(fname)[0]
        
        fname_len = len(fname)
        underscore_count = fname.count("_")
        triple_underscore = 1.0 if "___" in fname else 0.0
        words = len(fname.replace("_", " ").replace("-", " ").split())
        
        dur = max(duration_sec, 0.5)
        dur_log = float(np.log1p(dur))
        dur_short = 1.0 if dur < 5.0 else 0.0
        dur_medium = 1.0 if 5.0 <= dur <= 30.0 else 0.0
        dur_long = 1.0 if dur > 30.0 else 0.0
        
        is_yt = 1.0 if any(k in fname.lower() for k in ["youtube", "yt", "v_"]) else 0.0
        has_ts = 1.0 if any(char.isdigit() for char in fname) else 0.0
        has_movie_year = 1.0 if any(str(yr) in fname for yr in range(1990, 2030)) else 0.0
        
        # Determine synthetic severity hint from real-time vision motion
        severity_score = 0.0
        if violence_signal > 0.7:
            severity_score = 4.0
        elif violence_signal > 0.4:
            severity_score = 2.0
        elif motion_energy > 50.0:
            severity_score = 1.0

        is_multi = 1.0 if motion_energy > 75.0 else 0.0

        return ModelPredictRequest(
            is_youtube=is_yt,
            filename_len=float(fname_len),
            underscore_count=float(underscore_count),
            duration_log=dur_log,
            duration_short=dur_short,
            duration_medium=dur_medium,
            duration_long=dur_long,
            has_timestamp=has_ts,
            filename_words=float(words),
            is_full_video=1.0 if dur > 10.0 else 0.0,
            label_severity=severity_score,
            is_multi_violence=is_multi,
            path_depth=2.0,
            triple_underscore=triple_underscore,
            has_movie_year=has_movie_year,
            clip_index=1.0,
            dur_vs_class_mean=round(dur / 10.0, 2),
            is_train_split=0.0
        )

# Singleton instance
model_service = ModelService()

