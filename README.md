<<<<<<< HEAD
# 🏙️ SentraCity AI Command Center & Incident Prediction Engine

### Production Smart City Mission Control Powered by FastAPI, React 19, OpenCV, and Gradient Boosting Machine Learning

---

## 🌟 System Overview

**SentraCity AI Command Center** is a high-availability, mission-critical platform engineered for metropolitan authorities, traffic police, municipal corporations, emergency response teams, urban planning, and government agencies.

The platform provides end-to-end integration across **Computer Vision (OpenCV + YOLOv8)**, **Machine Learning (`gradient_boosting_model.pkl`)**, **Live GPS Location Tracking**, **Acoustic Emergency Alarm Sirens & Multi-Agency Dispatch**, and a **Dual-Database Layer (ACID Relational + NoSQL Document Store)**.

---

## 🎯 Features Implemented

### 1. Tactical Camera, Video Recording & Upload for Violence Detection
- **Live Camera / Webcam Mode**: Captures browser webcam frames using HTML5 `MediaDevices` API, decodes frames in FastAPI via OpenCV, computes Farneback optical flow and kinetic motion energy, identifies bounding boxes, and overlays live HUD telemetry.
- **Video Recording Option**: Built-in tactical recorder records `.webm` video clips directly from live camera streams with a single click, and automatically uploads the clip to the backend for frame-by-frame violence assessment.
- **Video Upload Option**: Upload `.mp4`, `.webm`, or `.avi` surveillance files with automatic keyframe sampling, kinetic violence index calculation, and incident logging.
- **1-Click Test Scenarios**: Instant simulation buttons (*Violent Brawl*, *Crowd Surge*, *Highway Collision*, *Normal Flow*) to test model sensitivity without external files.

### 2. Emergency Alarm Siren & Multi-Agency Alert Broadcast
- **Tactical Alarm Siren**: Synthesizes realistic dual-tone emergency acoustic sirens (880 Hz / 640 Hz alternating tactical frequency) using the browser's native **Web Audio API** — 100% offline, zero external audio assets required. Includes topbar beacon flashing and instant operator silence controls.
- **Multi-Agency Alert Dispatch**: Broadcast alerts with customizable severity (*Critical*, *Warning*, *Normal*) targeted to specific departments:
  - 🚔 **Traffic Police**
  - 🏛️ **Municipal Corporations**
  - 🚑 **Emergency Response Teams (Ambulance, Fire, Rescue)**
  - 🛡️ **Smart City Authorities**
  - 📐 **Urban Planning Departments**
  - 🏢 **Government Agencies**
- **Multi-Channel Distribution**: Dispatches through Acoustic Siren, Priority SMS Gateway, Digital Trunk Radio, and Real-time In-App Push Banners.

### 3. Real-Time GPS Location Tracking & Fleet Dispatch
- **Interactive Tactical Vector Map**: High-resolution map with coordinate layers for:
  - Fixed CCTV Arrays (Nexus Parkway, Genesis Blvd, Zenith Plaza, Helix Hub)
  - Active Incidents with pulsing critical/warning geo-markers
  - Emergency Patrol Units (*Traffic Police Interceptor #102*, *Highway Squad #405*, *Trauma Ambulance #09*, *Fire Engine #14*, *Sanitation Fleet #22*, *Surveillance Drone #03*)
- **Live Movement Telemetry**: Realistic simulated vehicle drift along smart city road corridors with coordinates (lat/lng), heading degrees, and speed (km/h).
- **1-Click Emergency Dispatch**: Select any patrolling unit and target incident to calculate route coordinates, assign dispatch status in the database, and track response progression in real time.

### 4. Uploaded Machine Learning Model Integration (`gradient_boosting_model.pkl`)
- **Model Architecture**: Loaded `GradientBoostingClassifier` trained with scikit-learn on 18 video metadata & optical flow features:
  - `is_youtube`, `filename_len`, `underscore_count`, `duration_log`, `duration_short`, `duration_medium`, `duration_long`, `has_timestamp`, `filename_words`, `is_full_video`, `label_severity`, `is_multi_violence`, `path_depth`, `triple_underscore`, `has_movie_year`, `clip_index`, `dur_vs_class_mean`, `is_train_split`
- **7-Class Classification**:
  - `Class 0`: Normal Surveillance Feed (Non-Violence)
  - `Class 1`: Vehicle Collision & Traffic Crash
  - `Class 2`: Crowd Surge & Public Riot Choke Point
  - `Class 3`: Public Infrastructure Vandalism & Damage
  - `Class 4`: Street Robbery & Snatching Anomaly
  - `Class 5`: Weapon Threat & Armed Hostility
  - `Class 6`: Violent Physical Brawl & Assault
- **Interactive AI Engine Console**: Adjust all 18 features via sliders or numerical inputs, view real-time class probability distributions, confidence percentages, and assigned response departments.

### 5. Multi-Database Architecture (Consistency, Integrity, and Durability)
- **Primary Relational Database (SQLAlchemy)**:
  - Configured for **SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL`)** by default for zero-setup, zero-downtime ACID transactions on Windows.
  - 1-click switchable to **MySQL / MariaDB** via `DATABASE_URL=mysql+pymysql://user:pass@host/db`.
  - Enforces Foreign Key constraints (`cameras` ↔ `incidents` ↔ `alert_logs`), transaction rollbacks, and schema integrity.
- **High-Throughput NoSQL Document Store**:
  - Connects to native **MongoDB** (`mongodb://localhost:27017`) when available.
  - Features an automatic, atomic **Resilient File-Backed Document Store (`smart_city_nosql.json`)** fallback when an external MongoDB daemon is not running, guaranteeing 100% uptime with atomic file-swapping durability.
- **Comprehensive Database Health API**: Real-time status checks at `/api/system/health`.

---

## 📂 Project Architecture

```
smart-city-prediction-main/
├── backend/
│   ├── app/
│   │   ├── config.py             # Environment configuration & DB URLs
│   │   ├── database.py           # Dual DB: SQLAlchemy (SQLite WAL / MySQL) + MongoDB Document Store
│   │   ├── models.py             # SQLAlchemy models (Incident, Camera, EmergencyUnit, AlertLog)
│   │   ├── schemas.py            # Pydantic v2 validation models
│   │   ├── seed_data.py          # Smart City initial asset seeding
│   │   ├── services/
│   │   │   ├── model_service.py  # GradientBoostingClassifier inference
│   │   │   ├── vision_service.py # OpenCV optical flow & frame analysis
│   │   │   ├── alert_service.py  # Multi-agency alert dispatch & siren state
│   │   │   └── tracking_service.py # Real-time GPS coordinate telemetry
│   │   ├── routers/
│   │   │   ├── predict.py        # /api/predict/model & /api/predict/quick-scenarios
│   │   │   ├── vision.py         # /api/vision/detect-frame & /api/vision/upload-video
│   │   │   ├── incidents.py      # /api/incidents CRUD & statistics
│   │   │   ├── alerts.py         # /api/alerts & /api/alerts/broadcast
│   │   │   ├── tracking.py       # /api/tracking/locations & dispatch
│   │   │   └── system.py         # /api/system/health
│   │   └── main.py               # FastAPI application & CORS setup
│   ├── ml_models/
│   │   └── gradient_boosting_model.pkl # User uploaded model
│   ├── sample_media/             # Sample test video clips
│   ├── run.py                    # Backend server entrypoint
│   ├── test_backend.py           # 6-suite automated verification tests
│   └── requirements.txt
├── smart-city-prediction-main/
│   ├── src/
│   │   ├── api.ts                # Unified frontend API client with fallback
│   │   ├── types.ts              # TypeScript definitions
│   │   ├── utils/soundAlarm.ts   # Web Audio API emergency siren engine
│   │   ├── components/
│   │   │   ├── TacticalVisionPage.tsx  # Camera, Video Recording, Video Upload & AI
│   │   │   ├── LocationTrackingPage.tsx # GPS Tactical Map & Fleet Dispatch
│   │   │   ├── AIEnginePage.tsx        # 18-Feature Gradient Boosting console
│   │   │   ├── AlertsCenter.tsx        # Alarm siren & multi-agency broadcasts
│   │   │   ├── DashboardGrid.tsx       # Mission Control Dashboard
│   │   │   ├── TrafficPage.tsx         # Traffic Intelligence
│   │   │   ├── RoadDamagePage.tsx      # Infrastructure Health
│   │   │   ├── PublicSafetyPage.tsx    # Incident Management
│   │   │   ├── HeatmapPage.tsx         # Heatmap Analytics
│   │   │   ├── Sidebar.tsx             # Tactical Navigation Deck
│   │   │   └── Topbar.tsx              # HUD bar with live siren control
│   ├── package.json
│   └── vite.config.ts
├── run_backend.bat               # 1-Click backend launcher
├── run_frontend.bat              # 1-Click frontend launcher
├── run_all.bat                   # 1-Click full system launcher
└── README.md
```

---

## 🚀 How to Run

### Step 1: Launch Backend (FastAPI)
```bash
python backend/run.py
```
* Backend starts at `http://127.0.0.1:8000`
* Interactive API Documentation (Swagger) is available at `http://127.0.0.1:8000/docs`

### Step 2: Launch Frontend (React + Vite)
```bash
cd smart-city-prediction-main
npm run dev
```
* Frontend starts at `http://localhost:3000`

### Or Launch Both Together:
Double-click `run_all.bat` in the root folder.

---

## 🧪 Automated Testing & Verification

Run the comprehensive test suite verifying database durability, uploaded model predictions, OpenCV vision analysis, alerts, alarms, and GPS location tracking:

```bash
python backend/test_backend.py
```

**Verification Results:**
- `test_01_databases_integrity_and_durability`: **PASSED** (SQLite WAL & NoSQL DocumentStore verified)
- `test_02_uploaded_gradient_boosting_model_inference`: **PASSED** (18 features evaluated across 7 classes)
- `test_03_opencv_frame_vision_analysis`: **PASSED** (Optical flow & bounding boxes computed)
- `test_04_incidents_lifecycle`: **PASSED** (CRUD, status transitions, and audit logs)
- `test_05_alerts_alarm_and_multi_agency_broadcasting`: **PASSED** (Emergency siren & multi-department dispatches)
- `test_06_gps_location_tracking_and_fleet_dispatch`: **PASSED** (Live coordinates & unit dispatch)

=======
hello
>>>>>>> defa98c2a3f79fa2468823b071c1efa8a607124a
