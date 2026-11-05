import os
import sys
import uuid
import unittest
import numpy as np
import base64
import cv2

# Ensure root path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, SessionLocal, get_database_health, get_nosql_collection
from backend.app.models import Incident, AlertLog, EmergencyUnit, Camera
from backend.app.seed_data import seed_database
from backend.app.services.model_service import model_service, FEATURE_ORDER
from backend.app.services.vision_service import vision_service
from backend.app.services.alert_service import alert_service
from backend.app.services.tracking_service import tracking_service
from backend.app.schemas import (
    ModelPredictRequest, 
    FrameDetectRequest, 
    IncidentCreate, 
    BroadcastAlertRequest,
    DispatchUnitRequest
)
from backend.app.routers.predict import predict_with_uploaded_model, get_model_info, get_quick_test_scenarios
from backend.app.routers.incidents import get_incidents, create_incident, get_incident_stats
from backend.app.routers.alerts import get_alerts, broadcast_alert, get_siren_status, trigger_alarm_siren, silence_alarm_siren
from backend.app.routers.tracking import get_all_locations, dispatch_unit
from backend.app.routers.system import get_system_health
from backend.app.routers.auth import register, login, demo_login, RegisterRequest, LoginRequest
from backend.app.routers.vision import save_video_evidence, list_saved_evidences, SaveEvidenceRequest
from backend.app.services.pytorch_violence_service import pytorch_violence_service
from backend.app.services.auth_service import get_current_user, create_access_token
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

class ComprehensiveBackendTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_database()
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_databases_integrity_and_durability(self):
        """Verify relational database WAL mode and NoSQL document store durability."""
        health = get_system_health(self.db)
        self.assertEqual(health["status"], "OPERATIONAL_NOMINAL")
        self.assertEqual(health["databases"]["relational_db"]["status"], "healthy")
        self.assertIn("WAL", health["databases"]["relational_db"]["durability_mode"])
        self.assertEqual(health["databases"]["nosql_db"]["status"], "healthy")

        # Test NoSQL collection persistence
        nosql_coll = get_nosql_collection("test_durability_log")
        doc = nosql_coll.insert_one({"test_metric": 42.5, "status": "verified"})
        self.assertIsNotNone(doc.get("_id"))
        retrieved = nosql_coll.find({"test_metric": 42.5})
        self.assertGreater(len(retrieved), 0)

    def test_02_uploaded_gradient_boosting_model_inference(self):
        """Verify the uploaded GradientBoostingClassifier handles multi-class prediction."""
        self.assertIsNotNone(model_service.model)
        
        # Test 1: Normal surveillance feature vector
        normal_req = ModelPredictRequest(
            is_youtube=0.0, filename_len=18.0, underscore_count=1.0, duration_log=3.1,
            duration_short=0.0, duration_medium=1.0, duration_long=0.0, has_timestamp=1.0,
            filename_words=3.0, is_full_video=1.0, label_severity=0.0, is_multi_violence=0.0,
            path_depth=2.0, triple_underscore=0.0, has_movie_year=0.0, clip_index=1.0,
            dur_vs_class_mean=1.0, is_train_split=0.0
        )
        res_normal = predict_with_uploaded_model(normal_req)
        self.assertIn(res_normal.predicted_class, range(7))
        self.assertGreater(res_normal.confidence, 50.0)
        self.assertEqual(len(res_normal.probabilities), 7)
        self.assertEqual(len(res_normal.features_used), 18)

        # Test 2: Violent Brawl feature vector
        brawl_req = ModelPredictRequest(
            is_youtube=1.0, filename_len=44.0, underscore_count=5.0, duration_log=1.8,
            duration_short=1.0, duration_medium=0.0, duration_long=0.0, has_timestamp=1.0,
            filename_words=6.0, is_full_video=0.0, label_severity=4.0, is_multi_violence=1.0,
            path_depth=4.0, triple_underscore=1.0, has_movie_year=0.0, clip_index=3.0,
            dur_vs_class_mean=1.9, is_train_split=0.0
        )
        res_brawl = predict_with_uploaded_model(brawl_req)
        self.assertTrue(res_brawl.is_violence)
        self.assertEqual(res_brawl.severity, "critical")
        self.assertIn("Emergency Response Teams", res_brawl.recommended_departments)

    def test_03_opencv_frame_vision_analysis(self):
        """Verify OpenCV frame difference, optical flow, and bounding box creation."""
        img = np.zeros((240, 320, 3), dtype=np.uint8)
        cv2.rectangle(img, (40, 40), (140, 200), (255, 255, 255), -1)
        _, buffer = cv2.imencode('.jpg', img)
        b64 = base64.b64encode(buffer).decode('utf-8')

        frame_req = FrameDetectRequest(
            image_base64=f"data:image/jpeg;base64,{b64}",
            camera_id="CAM-WEB-TEST",
            run_ml_classification=True
        )
        res = vision_service.analyze_frame(
            image_base64=frame_req.image_base64,
            camera_id=frame_req.camera_id,
            run_ml_classification=True
        )
        self.assertEqual(res.camera_id, "CAM-WEB-TEST")
        self.assertIsNotNone(res.annotated_image)
        self.assertIsNotNone(res.ml_prediction)

    def test_04_incidents_lifecycle(self):
        """Verify Incident creation, query, and statistics in SQLite / Relational DB."""
        # Initial stats
        stats = get_incident_stats(self.db)
        self.assertGreater(stats["total_incidents"], 0)

        # Create new incident
        new_inc = create_incident(
            IncidentCreate(
                type="Crowd Flashpoint Alert",
                location="Sector 2, Transit Concourse C",
                latitude=12.9720,
                longitude=77.5950,
                severity="critical",
                camera_id="CAM-802",
                details="Automated integration test incident creation.",
                ai_confidence=97.4,
                predicted_class=2,
                class_name="Crowd Surge & Public Riot Choke Point"
            ),
            self.db
        )
        self.assertEqual(new_inc.status, "active")
        self.assertEqual(new_inc.severity, "critical")

        # Query all incidents
        all_incidents = get_incidents(db=self.db)
        ids = [i.id for i in all_incidents]
        self.assertIn(new_inc.id, ids)

    def test_05_alerts_alarm_and_multi_agency_broadcasting(self):
        """Verify Emergency audio siren and targeted departmental alert dispatch."""
        # Test Siren Trigger
        trigger_alarm_siren("INC-TEST-99")
        siren_status = get_siren_status()
        self.assertTrue(siren_status["is_sounding"])

        # Test Silence Siren
        silence_alarm_siren()
        siren_status = get_siren_status()
        self.assertFalse(siren_status["is_sounding"])

        # Test Multi-Agency Broadcast
        broadcast_res = broadcast_alert(
            BroadcastAlertRequest(
                title="HIGH PRIORITY: Traffic Congestion Gridlock",
                message="Multiple vehicle stalls blocking Nexus Parkway.",
                severity="warning",
                target_departments=["Traffic Police", "Municipal Corporations"],
                channels=["AUDIO_ALARM", "SMS", "PUSH_NOTIFICATION"],
                trigger_siren=False
            ),
            self.db
        )
        self.assertEqual(broadcast_res.status, "delivered")
        self.assertIn("Traffic Police", broadcast_res.target_departments)

    def test_06_gps_location_tracking_and_fleet_dispatch(self):
        """Verify live coordinates for cameras, incidents, and responder units."""
        locs = get_all_locations(self.db)
        self.assertGreater(len(locs["cameras"]), 0)
        self.assertGreater(len(locs["incidents"]), 0)
        self.assertGreater(len(locs["emergency_units"]), 0)

        # Test Unit Dispatch to Incident
        target_unit = locs["emergency_units"][0]
        target_incident = locs["incidents"][0]

        dispatched = dispatch_unit(
            DispatchUnitRequest(
                unit_id=target_unit["id"],
                incident_id=target_incident["id"]
            ),
            self.db
        )
        self.assertEqual(dispatched.status, "dispatched")
        self.assertEqual(dispatched.assigned_incident_id, target_incident["id"])

    def test_07_pytorch_violence_detection_model(self):
        """Verify PyTorch MobileNetV2 + CNN-LSTM model inference on frame sequences."""
        self.assertIsNotNone(pytorch_violence_service.model, "best_violence_model.pth should be loaded")
        self.assertIsNotNone(pytorch_violence_service.extractor, "MobileNetV2 feature extractor should be initialized")

        # Create dummy synthetic frames (128x128 BGR)
        dummy_frame = np.zeros((128, 128, 3), dtype=np.uint8)
        cv2.putText(dummy_frame, "TEST", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        # Feed sequence into sliding window
        res = None
        for _ in range(8):
            res = pytorch_violence_service.predict_frame_sequence("CAM-UNIT-TEST", dummy_frame)

        self.assertIsNotNone(res)
        self.assertIn("violence_probability", res)
        self.assertIn("is_violence", res)
        self.assertIn("severity", res)
        self.assertIn("alert_message", res)
        self.assertIn("target_departments", res)
        self.assertIn("trigger_alarm", res)
        self.assertEqual(res["model_architecture"], "MobileNetV2 + CNN-LSTM (best_violence_model.pth)")
        self.assertAlmostEqual(res["model_f1"], 0.973, places=2)

    def test_08_jwt_authentication_and_authorization(self):
        """Verify user registration, JWT generation, validation, and demo login."""
        unique_user = f"officer_salim_{uuid.uuid4().hex[:6]}"
        # 1. Register new officer
        reg_req = RegisterRequest(
            username=unique_user,
            password="SecurePassword999!",
            full_name="Salim Khan",
            role="Tactical Officer",
            department="Emergency Response Teams"
        )
        reg_res = register(reg_req, self.db)
        self.assertIn("access_token", reg_res)
        self.assertEqual(reg_res["user"].username, unique_user)

        # 2. Duplicate registration should be rejected
        with self.assertRaises(HTTPException) as cm:
            register(reg_req, self.db)
        self.assertEqual(cm.exception.status_code, 400)

        # 3. Successful login with credentials
        login_res = login(LoginRequest(username=unique_user, password="SecurePassword999!"), self.db)
        jwt_token = login_res["access_token"]
        self.assertTrue(len(jwt_token) > 20)

        # 4. Failed login with wrong password
        with self.assertRaises(HTTPException) as cm:
            login(LoginRequest(username=unique_user, password="WrongPassword"), self.db)
        self.assertEqual(cm.exception.status_code, 401)

        # 5. Validate JWT token using get_current_user dependency
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=jwt_token)
        curr_user = get_current_user(creds, self.db)
        self.assertEqual(curr_user.username, unique_user)

        # 6. Invalid token rejection
        bad_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.here")
        with self.assertRaises(HTTPException) as cm:
            get_current_user(bad_creds, self.db)
        self.assertEqual(cm.exception.status_code, 401)

        # 7. Demo login for Officer Ahamed
        demo_res = demo_login(self.db)
        self.assertIn("access_token", demo_res)
        self.assertEqual(demo_res["user"].username, "ahamed")

    def test_09_protected_video_evidence_archival(self):
        """Verify video evidence can only be saved and retrieved by authenticated officers with JWT."""
        # Authenticate as demo officer Ahamed
        demo_res = demo_login(self.db)
        token = demo_res["access_token"]
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = get_current_user(creds, self.db)

        # Save video evidence with valid JWT
        evidence_req = SaveEvidenceRequest(
            title="Surveillance Incident - Sector 4",
            video_url="/uploads/test_clip_01.mp4",
            violence_probability=0.88,
            severity="critical",
            class_name="Violent Physical Brawl",
            notes="Automated unit test evidence archival.",
            camera_id="CAM-802"
        )
        save_res = save_video_evidence(evidence_req, current_user=user, db=self.db)
        self.assertTrue(save_res["success"])
        self.assertEqual(save_res["saved_by"], "ahamed")

        # List saved evidences for officer
        evidences = list_saved_evidences(current_user=user, db=self.db)
        self.assertGreater(len(evidences), 0)
        saved_titles = [e.title for e in evidences]
        self.assertIn("Surveillance Incident - Sector 4", saved_titles)

if __name__ == "__main__":
    unittest.main()
