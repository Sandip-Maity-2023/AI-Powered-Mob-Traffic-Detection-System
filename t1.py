
import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

from pathlib import Path
from torch.utils.data import Dataset, DataLoader, TensorDataset
from torchvision import models
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from tqdm import tqdm


# ============================================================
# 1. CONFIGURATION
# ============================================================

DATASET_PATH = "RealLifeViolenceDataset"

SEQUENCE_LENGTH = 8
FRAME_SIZE = 128

BATCH_SIZE = 2
LSTM_BATCH_SIZE = 64

HIDDEN_DIM = 128
EPOCHS = 15
LEARNING_RATE = 0.001
PATIENCE = 4

RANDOM_STATE = 42

CACHE_PATH = "./violence_features_cache.pt"
MODEL_PATH = "./best_violence_model.pth"

# CPU configuration
DEVICE = torch.device("cpu")

torch.set_num_threads(6)
cv2.setNumThreads(0)

torch.manual_seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

print("Using device:", DEVICE)
print("CPU threads:", torch.get_num_threads())


# ============================================================
# 2. VIDEO DATASET
# ============================================================

class ViolenceDataset(Dataset):

    def __init__(self, video_paths, labels):

        self.video_paths = video_paths
        self.labels = labels

        self.mean = np.array(
            [0.485, 0.456, 0.406],
            dtype=np.float32
        )

        self.std = np.array(
            [0.229, 0.224, 0.225],
            dtype=np.float32
        )

    def __len__(self):
        return len(self.video_paths)

    def __getitem__(self, idx):

        video_path = self.video_paths[idx]

        cap = cv2.VideoCapture(video_path)

        frames = []

        total_frames = int(
            cap.get(cv2.CAP_PROP_FRAME_COUNT)
        )

        # Select uniformly distributed frame indices
        if total_frames > 0:

            indices = np.linspace(
                0,
                total_frames - 1,
                SEQUENCE_LENGTH
            ).round().astype(int)

            wanted = set(indices.tolist())

            frame_idx = 0

            while frame_idx <= indices[-1]:

                ret, frame = cap.read()

                if not ret:
                    break

                if frame_idx in wanted:

                    frame = cv2.cvtColor(
                        frame,
                        cv2.COLOR_BGR2RGB
                    )

                    frame = cv2.resize(
                        frame,
                        (FRAME_SIZE, FRAME_SIZE),
                        interpolation=cv2.INTER_AREA
                    )

                    frame = frame.astype(np.float32) / 255.0

                    frame = (frame - self.mean) / self.std

                    frame = torch.from_numpy(
                        frame
                    ).permute(2, 0, 1)

                    frames.append(frame)

                frame_idx += 1

                if len(frames) == SEQUENCE_LENGTH:
                    break

        else:

            # Fallback for videos without frame count metadata
            for _ in range(SEQUENCE_LENGTH):

                ret, frame = cap.read()

                if not ret:
                    break

                frame = cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB
                )

                frame = cv2.resize(
                    frame,
                    (FRAME_SIZE, FRAME_SIZE)
                )

                frame = frame.astype(np.float32) / 255.0
                frame = (frame - self.mean) / self.std

                frames.append(
                    torch.from_numpy(frame).permute(2, 0, 1)
                )

        cap.release()

        # Handle short or corrupted videos
        if len(frames) == 0:

            frames = [
                torch.zeros(3, FRAME_SIZE, FRAME_SIZE)
                for _ in range(SEQUENCE_LENGTH)
            ]

        while len(frames) < SEQUENCE_LENGTH:

            frames.append(frames[-1].clone())

        frames = frames[:SEQUENCE_LENGTH]

        return (
            torch.stack(frames),
            torch.tensor(self.labels[idx], dtype=torch.float32),
            idx
        )


# ============================================================
# 3. COLLECT VIDEO PATHS
# ============================================================

def load_video_paths(data_dir):

    video_paths = []
    labels = []

    classes = {
        "NonViolence": 0,
        "Violence": 1
    }

    for class_name, label in classes.items():

        folder = Path(data_dir) / class_name

        if not folder.exists():
            raise FileNotFoundError(folder)

        for path in folder.iterdir():

            if path.suffix.lower() in [".mp4", ".avi"]:

                video_paths.append(str(path))
                labels.append(label)

    print("Total videos:", len(video_paths))

    print(
        "NonViolence:",
        labels.count(0)
    )

    print(
        "Violence:",
        labels.count(1)
    )

    return video_paths, labels


# ============================================================
# 4. MOBILENETV2 FEATURE EXTRACTOR
# ============================================================

class MobileNetFeatureExtractor(nn.Module):

    def __init__(self):

        super().__init__()

        weights = models.MobileNet_V2_Weights.DEFAULT

        mobilenet = models.mobilenet_v2(
            weights=weights
        )

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
# 5. EXTRACT AND CACHE FEATURES
# ============================================================

def extract_features(video_paths, labels):

    # Reuse existing cache if it matches the dataset
    if os.path.exists(CACHE_PATH):

        print("\nLoading cached features...")

        cache = torch.load(
            CACHE_PATH,
            map_location="cpu"
        )

        if (
            cache["paths"] == video_paths
            and cache["labels"] == labels
            and cache["sequence_length"] == SEQUENCE_LENGTH
            and cache["frame_size"] == FRAME_SIZE
        ):

            print("Feature cache loaded successfully.")

            return cache["features"], cache["labels"]

        print("Cache configuration changed. Re-extracting.")

    dataset = ViolenceDataset(
        video_paths,
        labels
    )

    loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0,
        pin_memory=False
    )

    extractor = MobileNetFeatureExtractor().to(DEVICE)

    extractor.eval()

    all_features = torch.empty(
        len(dataset),
        SEQUENCE_LENGTH,
        1280
    )

    print("\nStarting MobileNetV2 feature extraction...")

    with torch.inference_mode():

        for videos, targets, indices in tqdm(loader):

            batch_size, seq_len, C, H, W = videos.shape

            # Merge batch and sequence dimensions
            videos = videos.view(
                batch_size * seq_len,
                C,
                H,
                W
            )

            features = extractor(videos)

            # Restore temporal dimensions
            features = features.view(
                batch_size,
                seq_len,
                1280
            )

            all_features[indices] = features.cpu()

    del extractor

    if DEVICE.type == "cpu":
        import gc
        gc.collect()

    # Store features for subsequent training runs
    torch.save(
        {
            "features": all_features,
            "labels": labels,
            "paths": video_paths,
            "sequence_length": SEQUENCE_LENGTH,
            "frame_size": FRAME_SIZE
        },
        CACHE_PATH
    )

    print("\nFeature extraction completed.")
    print("Feature shape:", all_features.shape)

    return all_features, labels


# ============================================================
# 6. CNN-LSTM CLASSIFICATION MODEL
# ============================================================

class CNNLSTMViolenceModel(nn.Module):

    def __init__(
        self,
        hidden_dim=128,
        num_layers=1
    ):

        super().__init__()

        self.lstm = nn.LSTM(
            input_size=1280,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True
        )

        self.dropout = nn.Dropout(0.3)

        self.fc = nn.Linear(
            hidden_dim,
            1
        )

    def forward(self, x):

        # Input:
        # (batch, sequence_length, 1280)

        lstm_out, (hn, cn) = self.lstm(x)

        last_hidden = hn[-1]

        out = self.dropout(last_hidden)

        out = self.fc(out)

        return out.squeeze(-1)


# ============================================================
# 7. TRAINING AND VALIDATION
# ============================================================

def train_model():

    video_paths, labels = load_video_paths(
        DATASET_PATH
    )

    indices = np.arange(len(video_paths))

    train_idx, val_idx = train_test_split(
        indices,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=labels
    )

    # Extract features once
    features, labels = extract_features(
        video_paths,
        labels
    )

    labels = torch.tensor(
        labels,
        dtype=torch.float32
    )

    X_train = features[train_idx]
    X_val = features[val_idx]

    y_train = labels[train_idx]
    y_val = labels[val_idx]

    train_dataset = TensorDataset(
        X_train,
        y_train
    )

    val_dataset = TensorDataset(
        X_val,
        y_val
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=LSTM_BATCH_SIZE,
        shuffle=True,
        num_workers=0
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=LSTM_BATCH_SIZE,
        shuffle=False,
        num_workers=0
    )

    # Model
    model = CNNLSTMViolenceModel(
        hidden_dim=HIDDEN_DIM
    ).to(DEVICE)

    # Handle class imbalance
    positive_count = y_train.sum().item()

    negative_count = len(y_train) - positive_count

    pos_weight = torch.tensor(
        [negative_count / max(positive_count, 1)],
        dtype=torch.float32
    )

    criterion = nn.BCEWithLogitsLoss(
        pos_weight=pos_weight
    )

    optimizer = optim.Adam(
        model.parameters(),
        lr=LEARNING_RATE
    )

    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode="max",
        factor=0.5,
        patience=2
    )

    best_f1 = -1.0
    patience_counter = 0

    # ========================================================
    # EPOCH LOOP
    # ========================================================

    for epoch in range(EPOCHS):

        model.train()

        train_loss = 0.0

        train_predictions = []
        train_targets = []

        for X, y in train_loader:

            X = X.to(DEVICE)
            y = y.to(DEVICE)

            optimizer.zero_grad(set_to_none=True)

            outputs = model(X)

            loss = criterion(outputs, y)

            loss.backward()

            optimizer.step()

            train_loss += loss.item() * X.size(0)

            predictions = (
                torch.sigmoid(outputs) >= 0.5
            ).float()

            train_predictions.extend(
                predictions.cpu().numpy()
            )

            train_targets.extend(
                y.cpu().numpy()
            )

        train_loss /= len(train_dataset)

        train_acc = accuracy_score(
            train_targets,
            train_predictions
        )

        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        model.eval()

        val_loss = 0.0

        val_predictions = []
        val_targets = []

        with torch.inference_mode():

            for X, y in val_loader:

                X = X.to(DEVICE)
                y = y.to(DEVICE)

                outputs = model(X)

                loss = criterion(outputs, y)

                val_loss += loss.item() * X.size(0)

                predictions = (
                    torch.sigmoid(outputs) >= 0.5
                ).float()

                val_predictions.extend(
                    predictions.cpu().numpy()
                )

                val_targets.extend(
                    y.cpu().numpy()
                )

        val_loss /= len(val_dataset)

        val_acc = accuracy_score(
            val_targets,
            val_predictions
        )

        val_f1 = f1_score(
            val_targets,
            val_predictions,
            zero_division=0
        )

        val_precision = precision_score(
            val_targets,
            val_predictions,
            zero_division=0
        )

        val_recall = recall_score(
            val_targets,
            val_predictions,
            zero_division=0
        )

        scheduler.step(val_f1)

        print(f"\nEpoch {epoch+1}/{EPOCHS}")

        print(
            f"Train Loss: {train_loss:.4f} | "
            f"Train Acc: {train_acc:.4f}"
        )

        print(
            f"Val Loss: {val_loss:.4f} | "
            f"Val Acc: {val_acc:.4f}"
        )

        print(
            f"Precision: {val_precision:.4f} | "
            f"Recall: {val_recall:.4f} | "
            f"F1: {val_f1:.4f}"
        )

        # Save best model based on F1
        if val_f1 > best_f1:

            best_f1 = val_f1

            patience_counter = 0

            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "best_f1": best_f1,
                    "sequence_length": SEQUENCE_LENGTH,
                    "frame_size": FRAME_SIZE,
                    "hidden_dim": HIDDEN_DIM
                },
                MODEL_PATH
            )

            print("Best model saved.")

        else:

            patience_counter += 1

        if patience_counter >= PATIENCE:

            print("\nEarly stopping triggered.")

            break

    # ========================================================
    # FINAL VALIDATION REPORT
    # ========================================================

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    predictions = []

    with torch.inference_mode():

        for X, y in val_loader:

            outputs = model(X.to(DEVICE))

            predictions.extend(
                (
                    torch.sigmoid(outputs) >= 0.5
                ).int().cpu().numpy()
            )

    print("\nFINAL CLASSIFICATION REPORT")

    print(
        classification_report(
            y_val.numpy(),
            predictions,
            target_names=[
                "NonViolence",
                "Violence"
            ],
            zero_division=0
        )
    )

    print("Confusion Matrix:")

    print(
        confusion_matrix(
            y_val.numpy(),
            predictions
        )
    )

    print("Best validation F1:", best_f1)

    print("Saved model:", MODEL_PATH)


# ============================================================
# 8. EXECUTION
# ============================================================

if __name__ == "__main__":

    train_model()
