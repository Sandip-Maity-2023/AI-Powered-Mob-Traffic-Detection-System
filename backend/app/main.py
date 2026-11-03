import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.seed_data import seed_database
from backend.app.routers import (
    predict,
    vision,
    incidents,
    alerts,
    tracking,
    system
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart City Mission Control & Incident Prediction Engine powered by FastAPI, YOLOv8, OpenCV and GradientBoostingClassifier",
    version="4.2.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static video access
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(vision.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(tracking.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    """Ensure database schema is created and seeded on server initialization."""
    seed_database()

@app.get("/")
def root_status():
    return {
        "status": "ONLINE",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "endpoints": {
            "prediction": f"{settings.API_V1_STR}/predict/model",
            "computer_vision": f"{settings.API_V1_STR}/vision/detect-frame",
            "video_upload": f"{settings.API_V1_STR}/vision/upload-video",
            "incidents": f"{settings.API_V1_STR}/incidents",
            "alerts_alarm": f"{settings.API_V1_STR}/alerts",
            "location_tracking": f"{settings.API_V1_STR}/tracking/locations",
            "system_health": f"{settings.API_V1_STR}/system/health"
        }
    }

