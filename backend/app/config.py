import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "SentraCity AI Smart City Command Center"
    API_V1_STR: str = "/api"
    
    # Primary Relational Database (SQLite with WAL mode by default, or MySQL/Postgres via DATABASE_URL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'smart_city.db'}"
    )
    
    # NoSQL Database (MongoDB connection URL or fallback Document Store)
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "sentracity_nosql")
    NOSQL_FALLBACK_FILE: str = str(BASE_DIR / "smart_city_nosql.json")
    
    # Uploaded Machine Learning Model
    ML_MODEL_PATH: str = os.getenv(
        "ML_MODEL_PATH",
        str(BASE_DIR / "ml_models" / "gradient_boosting_model.pkl")
    )
    
    # Uploaded media storage
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(BASE_DIR / "ml_models", exist_ok=True)

