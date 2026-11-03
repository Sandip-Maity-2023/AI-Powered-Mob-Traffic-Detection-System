import cv2
import numpy as np
import base64
import os
import time
from typing import Dict, Any, List, Tuple, Optional
from backend.app.schemas import BoundingBox, FrameDetectResponse
from backend.app.services.model_service import model_service

class VisionService:
    def __init__(self):
        # Cache previous grayscale frames per camera to compute optical flow & motion vectors
        self.prev_frames: Dict[str, np.ndarray] = {}
        # Background subtractor for robust surveillance motion & entity tracking
        try:
            self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=25, detectShadows=True)
        except Exception:
            self.bg_subtractor = None

    def _decode_image(self, base64_str: str) -> Optional[np.ndarray]:
        """Decode base64 data URL into OpenCV BGR numpy image."""
        try:
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            img_bytes = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            return None

    def _encode_image(self, img: np.ndarray) -> str:
        """Encode OpenCV BGR image into JPEG base64 data URL."""
        _, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        b64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{b64}"

    def analyze_frame(
        self, 
        image_base64: str, 
        camera_id: str = "CAM-01",
        run_ml_classification: bool = True
    ) -> FrameDetectResponse:
        """Perform real-time Computer Vision analysis on an individual frame."""
        img = self._decode_image(image_base64)
        if img is None:
            # Fallback blank frame response
            return FrameDetectResponse(
                camera_id=camera_id,
                timestamp=time.strftime("%H:%M:%S"),
                motion_energy=0.0,
                optical_flow_magnitude=0.0,
                violence_probability=0.0,
                is_anomaly=False,
                incident_detected=None,
                severity="normal",
                bounding_boxes=[],
                annotated_image=None
            )

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray_blurred = cv2.GaussianBlur(gray, (21, 21), 0)

        prev_gray = self.prev_frames.get(camera_id)
        motion_energy = 0.0
        optical_flow_mag = 0.0
        violence_prob = 0.0

        bounding_boxes: List[BoundingBox] = []

        if prev_gray is not None and prev_gray.shape == gray.shape:
            # 1. Compute frame difference motion energy
            frame_diff = cv2.absdiff(prev_gray, gray_blurred)
            thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)[1]
            thresh = cv2.dilate(thresh, None, iterations=2)
            
            motion_pixels = cv2.countNonZero(thresh)
            total_pixels = h * w
            motion_energy = round(float(motion_pixels / total_pixels) * 100, 2)

            # 2. Compute motion contours for bounding boxes
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                if cv2.contourArea(cnt) < 600:
                    continue
                (x, y, cw, ch) = cv2.boundingRect(cnt)
                
                # Determine box label based on motion size
                aspect_ratio = float(ch) / cw if cw > 0 else 0
                label = "Pedestrian" if aspect_ratio > 1.2 else "Motion Zone"
                
                bounding_boxes.append(BoundingBox(
                    label=label,
                    confidence=round(float(min(0.70 + (cw * ch) / (w * h * 4), 0.98)), 2),
                    x=int(x),
                    y=int(y),
                    width=int(cw),
                    height=int(ch)
                ))

            # 3. Calculate Optical Flow magnitude
            try:
                small_prev = cv2.resize(prev_gray, (160, 120))
                small_curr = cv2.resize(gray_blurred, (160, 120))
                flow = cv2.calcOpticalFlowFarneback(
                    small_prev, small_curr, None, 0.5, 3, 15, 3, 5, 1.2, 0
                )
                mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
                optical_flow_mag = round(float(np.mean(mag) * 10), 2)
            except Exception:
                optical_flow_mag = 0.0

            # 4. Compute violence probability heuristic based on sudden turbulent kinetic energy
            kinetic_factor = (motion_energy * 0.4) + (optical_flow_mag * 0.6)
            violence_prob = round(float(min(max(kinetic_factor / 35.0, 0.05), 0.99)), 3)

        # Store current frame for next comparison
        self.prev_frames[camera_id] = gray_blurred

        # Draw HUD & bounding boxes on annotated frame
        annotated_img = img.copy()
        
        is_violence = violence_prob > 0.55 or motion_energy > 40.0
        severity = "critical" if violence_prob > 0.70 else "warning" if is_violence else "normal"
        incident_label = "Violent Brawl / Altercation" if violence_prob > 0.70 else ("Crowd Surge" if motion_energy > 40.0 else None)

        color = (0, 0, 255) if severity == "critical" else ((0, 165, 255) if severity == "warning" else (0, 255, 0))

        # Draw bounding boxes
        for box in bounding_boxes[:6]:
            cv2.rectangle(
                annotated_img, 
                (box.x, box.y), 
                (box.x + box.width, box.y + box.height), 
                color, 
                2
            )
            cv2.putText(
                annotated_img, 
                f"{box.label} {int(box.confidence * 100)}%", 
                (box.x, max(box.y - 6, 12)), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.45, 
                color, 
                1, 
                cv2.LINE_AA
            )

        # Draw top HUD banner
        hud_text = f"CAM: {camera_id} | MOTION: {motion_energy}% | V-INDEX: {int(violence_prob * 100)}%"
        cv2.rectangle(annotated_img, (0, 0), (w, 28), (15, 15, 20), -1)
        cv2.putText(annotated_img, hud_text, (10, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 240, 255), 1, cv2.LINE_AA)

        if incident_label:
            cv2.rectangle(annotated_img, (0, h - 30), (w, h), (0, 0, 180), -1)
            cv2.putText(annotated_img, f"ALERT: {incident_label.upper()} DETECTED", (10, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

        # Run GradientBoosting model if requested
        ml_prediction = None
        if run_ml_classification:
            feat_req = model_service.extract_features_from_video_meta(
                filename=f"live_{camera_id}_{int(time.time())}.mp4",
                duration_sec=3.0,
                motion_energy=motion_energy,
                violence_signal=violence_prob
            )
            ml_prediction = model_service.predict_from_features(feat_req)

        return FrameDetectResponse(
            camera_id=camera_id,
            timestamp=time.strftime("%H:%M:%S"),
            motion_energy=motion_energy,
            optical_flow_magnitude=optical_flow_mag,
            violence_probability=violence_prob,
            is_anomaly=is_violence,
            incident_detected=incident_label or (ml_prediction.class_name if ml_prediction and ml_prediction.is_violence else None),
            severity=severity,
            bounding_boxes=bounding_boxes,
            annotated_image=self._encode_image(annotated_img),
            ml_prediction=ml_prediction
        )

    def process_video_file(self, video_path: str, camera_id: str = "CAM-UPLOAD") -> Dict[str, Any]:
        """Process an uploaded video file through OpenCV & GradientBoosting Classifier."""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        duration_sec = total_frames / fps if total_frames > 0 else 5.0

        sample_rate = max(1, total_frames // 30) # Sample ~30 frames across video
        frame_idx = 0
        motion_energies: List[float] = []
        violence_scores: List[float] = []
        key_frames_annotated: List[str] = []

        prev_gray = None
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_rate == 0:
                h, w = frame.shape[:2]
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray_blurred = cv2.GaussianBlur(gray, (21, 21), 0)

                if prev_gray is not None and prev_gray.shape == gray.shape:
                    diff = cv2.absdiff(prev_gray, gray_blurred)
                    motion = cv2.countNonZero(cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)[1])
                    energy = (motion / (h * w)) * 100.0
                    motion_energies.append(energy)
                    
                    # Violence score heuristic
                    v_score = min(max(energy / 30.0, 0.05), 0.98)
                    violence_scores.append(v_score)

                    if len(key_frames_annotated) < 3 and v_score > 0.4:
                        cv2.putText(frame, f"VIOLENCE INDEX: {int(v_score*100)}%", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                        key_frames_annotated.append(self._encode_image(frame))

                prev_gray = gray_blurred
            frame_idx += 1

        cap.release()

        avg_motion = float(np.mean(motion_energies)) if motion_energies else 15.0
        max_violence = float(np.max(violence_scores)) if violence_scores else 0.15

        # Feed extracted parameters into GradientBoostingClassifier
        feat_req = model_service.extract_features_from_video_meta(
            filename=os.path.basename(video_path),
            duration_sec=duration_sec,
            motion_energy=avg_motion,
            violence_signal=max_violence
        )
        ml_prediction = model_service.predict_from_features(feat_req)

        return {
            "filename": os.path.basename(video_path),
            "duration_sec": round(duration_sec, 2),
            "total_frames": total_frames,
            "fps": round(fps, 1),
            "average_motion_energy": round(avg_motion, 2),
            "peak_violence_probability": round(max_violence, 3),
            "key_annotated_frames": key_frames_annotated,
            "prediction": ml_prediction.dict(),
            "is_violence": ml_prediction.is_violence,
            "recommended_severity": ml_prediction.severity
        }

vision_service = VisionService()
