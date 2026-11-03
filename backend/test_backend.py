import os
import sys
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

if __name__ == "__main__":
    unittest.main()
