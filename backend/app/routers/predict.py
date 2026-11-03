from fastapi import APIRouter, HTTPException
from backend.app.schemas import ModelPredictRequest, ModelPredictResponse
from backend.app.services.model_service import model_service, CLASS_METADATA, FEATURE_ORDER

router = APIRouter(prefix="/predict", tags=["AI Prediction Model"])

@router.post("/model", response_model=ModelPredictResponse)
def predict_with_uploaded_model(request: ModelPredictRequest):
    """
    Run prediction using the uploaded GradientBoostingClassifier model.
    Evaluates 18 input features and predicts incident/violence classification.
    """
    try:
        return model_service.predict_from_features(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")

@router.get("/model-info")
def get_model_info():
    """Retrieve metadata, feature definitions, and class labels for the uploaded model."""
    return {
        "model_name": "GradientBoostingClassifier (Violence & Incident Classifier)",
        "framework": "scikit-learn / ensemble",
        "file_path": model_service.model_path,
        "is_loaded": model_service.model is not None,
        "n_features": len(FEATURE_ORDER),
        "features": FEATURE_ORDER,
        "classes": [
            {"id": k, **v} for k, v in CLASS_METADATA.items()
        ]
    }

@router.get("/quick-scenarios")
def get_quick_test_scenarios():
    """Provide pre-configured realistic feature vectors for 1-click model testing."""
    return [
        {
            "name": "Normal Street Surveillance",
            "scenario": "Routine pedestrian flow outside Central Mall with steady walking speed.",
            "expected": "Normal Surveillance Feed (Non-Violence)",
            "features": {
                "is_youtube": 0.0, "filename_len": 18.0, "underscore_count": 1.0,
                "duration_log": 3.1, "duration_short": 0.0, "duration_medium": 1.0, "duration_long": 0.0,
                "has_timestamp": 1.0, "filename_words": 3.0, "is_full_video": 1.0,
                "label_severity": 0.0, "is_multi_violence": 0.0, "path_depth": 2.0,
                "triple_underscore": 0.0, "has_movie_year": 0.0, "clip_index": 1.0,
                "dur_vs_class_mean": 1.0, "is_train_split": 0.0
            }
        },
        {
            "name": "Violent Physical Brawl Alert",
            "scenario": "Two groups clashing violently with rapid strike motions and sudden dispersal.",
            "expected": "Violent Physical Brawl & Assault",
            "features": {
                "is_youtube": 1.0, "filename_len": 44.0, "underscore_count": 5.0,
                "duration_log": 1.8, "duration_short": 1.0, "duration_medium": 0.0, "duration_long": 0.0,
                "has_timestamp": 1.0, "filename_words": 6.0, "is_full_video": 0.0,
                "label_severity": 4.0, "is_multi_violence": 1.0, "path_depth": 4.0,
                "triple_underscore": 1.0, "has_movie_year": 0.0, "clip_index": 3.0,
                "dur_vs_class_mean": 1.9, "is_train_split": 0.0
            }
        },
        {
            "name": "Armed Weapon Threat",
            "scenario": "Subject brandishing firearm in commercial alleyway with threatening posture.",
            "expected": "Weapon Threat & Armed Hostility",
            "features": {
                "is_youtube": 0.0, "filename_len": 38.0, "underscore_count": 4.0,
                "duration_log": 2.2, "duration_short": 1.0, "duration_medium": 0.0, "duration_long": 0.0,
                "has_timestamp": 1.0, "filename_words": 5.0, "is_full_video": 0.0,
                "label_severity": 5.0, "is_multi_violence": 1.0, "path_depth": 3.0,
                "triple_underscore": 1.0, "has_movie_year": 1.0, "clip_index": 2.0,
                "dur_vs_class_mean": 2.2, "is_train_split": 0.0
            }
        },
        {
            "name": "Vehicle Collision & Crash",
            "scenario": "Sudden deceleration and impact between delivery truck and commuter car.",
            "expected": "Vehicle Collision & Traffic Crash",
            "features": {
                "is_youtube": 0.0, "filename_len": 28.0, "underscore_count": 2.0,
                "duration_log": 2.8, "duration_short": 0.0, "duration_medium": 1.0, "duration_long": 0.0,
                "has_timestamp": 1.0, "filename_words": 4.0, "is_full_video": 0.0,
                "label_severity": 2.0, "is_multi_violence": 0.0, "path_depth": 2.0,
                "triple_underscore": 0.0, "has_movie_year": 0.0, "clip_index": 2.0,
                "dur_vs_class_mean": 1.1, "is_train_split": 0.0
            }
        },
        {
            "name": "Crowd Riot / Choke Point",
            "scenario": "Abrupt surge of over 200 commuters towards transit gates causing safety breach.",
            "expected": "Crowd Surge & Public Riot Choke Point",
            "features": {
                "is_youtube": 1.0, "filename_len": 50.0, "underscore_count": 6.0,
                "duration_log": 3.8, "duration_short": 0.0, "duration_medium": 0.0, "duration_long": 1.0,
                "has_timestamp": 0.0, "filename_words": 8.0, "is_full_video": 1.0,
                "label_severity": 3.0, "is_multi_violence": 1.0, "path_depth": 3.0,
                "triple_underscore": 0.0, "has_movie_year": 0.0, "clip_index": 1.0,
                "dur_vs_class_mean": 0.9, "is_train_split": 0.0
            }
        }
    ]

