import os
import cv2
import logging
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path
from torchvision import models
from typing import Dict, Any, List, Optional

logger = logging.getLogger("sentracity.pytorch_violence")

# Configuration matching t1.py
SEQUENCE_LENGTH = 8
FRAME_SIZE = 128
HIDDEN_DIM = 128
DEVICE = torch.device("cpu")

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


# ============================================================
# MobileNetV2 Feature Extractor (as defined in t1.py)
# ============================================================
class MobileNetFeatureExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        weights = models.MobileNet_V2_Weights.DEFAULT
        mobilenet = models.mobilenet_v2(weights=weights)
        self.features = mobilenet.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))

        # Freeze all CNN parameters
        for param in self.parameters():
            param.requires_grad = False
        self.eval()

    def forward(self, x):
        with torch.no_grad():
            x = self.features(x)
            x = self.pool(x)
            x = torch.flatten(x, 1)
        return x


# ============================================================
# CNN-LSTM Violence Model (as defined in t1.py)
# ============================================================
class CNNLSTMViolenceModel(nn.Module):
    def __init__(self, hidden_dim=128, num_layers=1):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=1280,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True
        )
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        # Input shape: (batch, sequence_length, 1280)
        lstm_out, (hn, cn) = self.lstm(x)
        last_hidden = hn[-1]
        out = self.dropout(last_hidden)
        out = self.fc(out)
        return out.squeeze(-1)


# ============================================================
# PyTorch Violence Inference Service
# ============================================================
class PyTorchViolenceService:
    def __init__(self):
        self.model = None
        self.extractor = None
        self.best_f1 = 0.973
        self.camera_frame_buffers: Dict[str, List[np.ndarray]] = {}

        self._init_models()

    def _find_model_path(self) -> Optional[str]:
        candidates = [
            "backend/ml_models/best_violence_model.pth",
            "best_violence_model.pth",
            "../best_violence_model.pth",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "best_violence_model.pth"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml_models", "best_violence_model.pth"),
        ]
        for p in candidates:
            if os.path.exists(p):
                return p
        return None

    def _init_models(self):
        try:
            model_path = self._find_model_path()
            if not model_path:
                logger.warning("best_violence_model.pth not found in candidate paths.")
                return

            # Initialize MobileNet feature extractor
            self.extractor = MobileNetFeatureExtractor().to(DEVICE)
            self.extractor.eval()

            # Initialize LSTM classifier
            self.model = CNNLSTMViolenceModel(hidden_dim=HIDDEN_DIM).to(DEVICE)
            checkpoint = torch.load(model_path, map_location=DEVICE, weights_only=False)

            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.best_f1 = checkpoint.get("best_f1", 0.973)
            elif isinstance(checkpoint, dict):
                self.model.load_state_dict(checkpoint)

            self.model.eval()
            logger.info(f"Loaded best_violence_model.pth successfully from {model_path} (F1: {self.best_f1:.4f})")
        except Exception as e:
            logger.error(f"Error loading PyTorch violence model: {e}")

    def _preprocess_frame(self, frame: np.ndarray) -> torch.Tensor:
        """Resize, convert color, and normalize a single BGR OpenCV frame."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_AREA)
        norm = resized.astype(np.float32) / 255.0
        norm = (norm - MEAN) / STD
        tensor = torch.from_numpy(norm).permute(2, 0, 1) # (3, 128, 128)
        return tensor

    def predict_video_file(self, video_path: str) -> Dict[str, Any]:
        """
        Sample 8 uniform frames across the video and run inference via MobileNetV2 + CNN-LSTM
        as implemented in t1.py.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        duration_sec = total_frames / fps if total_frames > 0 else 3.0

        frames = []
        if total_frames > 0:
            indices = np.linspace(0, total_frames - 1, SEQUENCE_LENGTH).round().astype(int)
            wanted = set(indices.tolist())
            frame_idx = 0

            while frame_idx <= indices[-1]:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx in wanted:
                    tensor = self._preprocess_frame(frame)
                    frames.append(tensor)
                frame_idx += 1
                if len(frames) == SEQUENCE_LENGTH:
                    break
        else:
            for _ in range(SEQUENCE_LENGTH):
                ret, frame = cap.read()
                if not ret:
                    break
                frames.append(self._preprocess_frame(frame))

        cap.release()

        # Handle short videos: pad with last frame
        if len(frames) == 0:
            frames = [torch.zeros(3, FRAME_SIZE, FRAME_SIZE) for _ in range(SEQUENCE_LENGTH)]
        while len(frames) < SEQUENCE_LENGTH:
            frames.append(frames[-1].clone())
        frames = frames[:SEQUENCE_LENGTH]

        # Stack into batch tensor (1, 8, 3, 128, 128)
        video_tensor = torch.stack(frames).unsqueeze(0).to(DEVICE)
        return self._run_inference_on_tensor(video_tensor, duration_sec=duration_sec, total_frames=total_frames)

    def predict_frame_sequence(self, camera_id: str, frame: np.ndarray) -> Dict[str, Any]:
        """
        Sliding window buffer for live camera: accumulates frames until SEQUENCE_LENGTH
        is reached, then runs CNN-LSTM inference.
        """
        if camera_id not in self.camera_frame_buffers:
            self.camera_frame_buffers[camera_id] = []

        tensor = self._preprocess_frame(frame)
        buf = self.camera_frame_buffers[camera_id]
        buf.append(tensor)
        if len(buf) > SEQUENCE_LENGTH:
            buf.pop(0)

        # Pad if buffer not full yet
        padded = list(buf)
        while len(padded) < SEQUENCE_LENGTH:
            padded.insert(0, padded[0] if padded else tensor)

        video_tensor = torch.stack(padded[:SEQUENCE_LENGTH]).unsqueeze(0).to(DEVICE)
        return self._run_inference_on_tensor(video_tensor, duration_sec=float(len(buf))/10.0, total_frames=len(buf))

    def _run_inference_on_tensor(self, video_tensor: torch.Tensor, duration_sec: float = 3.0, total_frames: int = 8) -> Dict[str, Any]:
        """Run MobileNetV2 feature extraction and LSTM prediction on (1, 8, 3, 128, 128) tensor."""
        if self.model is None or self.extractor is None:
            # Re-init attempt
            self._init_models()

        with torch.inference_mode():
            batch_size, seq_len, C, H, W = video_tensor.shape
            flat_video = video_tensor.view(batch_size * seq_len, C, H, W)
            features = self.extractor(flat_video)
            features = features.view(batch_size, seq_len, 1280)

            logits = self.model(features)
            prob = float(torch.sigmoid(logits).item())

        is_violence = prob >= 0.50

        # Severity determination
        if prob >= 0.75:
            severity = "critical"
            class_name = "Violent Physical Brawl / Conflict"
            alert_message = "CRITICAL ALERT: Physical violence confirmed with high confidence. Immediate tactical intervention required."
            target_departments = ["Emergency Response Teams", "Traffic Police", "Smart City Authorities"]
            trigger_alarm = True
        elif prob >= 0.50:
            severity = "warning"
            class_name = "Physical Altercation / Hostility"
            alert_message = "WARNING ALERT: Suspicious aggressive behavior detected. Patrol response recommended."
            target_departments = ["Traffic Police", "Municipal Corporations"]
            trigger_alarm = False
        else:
            severity = "normal"
            class_name = "Normal Activity (Non-Violence)"
            alert_message = "Surveillance conditions nominal. No violence detected."
            target_departments = ["Smart City Authorities"]
            trigger_alarm = False

        confidence_pct = round(prob * 100 if is_violence else (1.0 - prob) * 100, 2)

        return {
            "is_violence": is_violence,
            "violence_probability": round(prob, 4),
            "confidence": confidence_pct,
            "severity": severity,
            "class_name": class_name,
            "alert_message": alert_message,
            "target_departments": target_departments,
            "trigger_alarm": trigger_alarm,
            "model_architecture": "MobileNetV2 + CNN-LSTM (best_violence_model.pth)",
            "model_f1": round(self.best_f1, 4),
            "duration_sec": round(duration_sec, 2),
            "sampled_frames": SEQUENCE_LENGTH
        }

pytorch_violence_service = PyTorchViolenceService()

