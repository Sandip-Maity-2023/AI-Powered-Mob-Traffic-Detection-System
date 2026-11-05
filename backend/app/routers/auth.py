from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.database import get_db
from backend.app.models import User
from backend.app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["JSON Web Token Authentication"])

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = "Tactical Operator"
    role: Optional[str] = "Field Dispatcher"
    department: Optional[str] = "Smart City Authorities"

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    department: str
    created_at: datetime

    class Config:
        from_attributes = True

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/register", response_model=AuthTokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register new command officer and return JWT access token."""
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered. Please login."
        )

    user = User(
        username=req.username.strip(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name or "Tactical Operator",
        role=req.role or "Field Dispatcher",
        department=req.department or "Smart City Authorities"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=AuthTokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with username & password, returns signed JWT."""
    user = db.query(User).filter(User.username == req.username.strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/demo-login", response_model=AuthTokenResponse)
def demo_login(db: Session = Depends(get_db)):
    """1-Click instant sign-in for testing as tactical dispatcher Officer Ahamed."""
    demo_user = db.query(User).filter(User.username == "ahamed").first()
    if not demo_user:
        demo_user = User(
            username="ahamed",
            hashed_password=hash_password("admin123"),
            full_name="Officer Ahamed",
            role="Tactical Dispatcher",
            department="Smart City Command"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    token = create_access_token({"sub": demo_user.username, "role": demo_user.role, "id": demo_user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": demo_user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Validate JWT token and return currently signed-in user."""
    return current_user

