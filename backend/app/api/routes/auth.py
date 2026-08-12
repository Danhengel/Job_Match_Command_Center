from datetime import datetime, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RecoveryStartRequest,
    RecoveryStartResponse,
    ResetPasswordRequest,
    MessageResponse,
    TokenResponse,
    UserResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    password_hash_fingerprint,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _recovery_expiry() -> datetime:
    try:
        value = settings.password_reset_recovery_expires_at.strip().replace("Z", "+00:00")
        expiry = datetime.fromisoformat(value)
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        return expiry.astimezone(timezone.utc)
    except (TypeError, ValueError):
        raise HTTPException(status_code=503, detail="Account recovery is not configured")


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = User(email=email, full_name=body.full_name.strip(), password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="This account is inactive")
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/recovery/start", response_model=RecoveryStartResponse)
def start_recovery(body: RecoveryStartRequest, db: Session = Depends(get_db)):
    configured_key = settings.password_reset_recovery_key.strip()
    configured_email = settings.password_reset_recovery_email.lower().strip()
    requested_email = body.email.lower().strip()

    if not configured_key or not configured_email:
        raise HTTPException(status_code=503, detail="Account recovery is not configured")
    if datetime.now(timezone.utc) >= _recovery_expiry():
        raise HTTPException(status_code=410, detail="This recovery window has expired")
    if requested_email != configured_email or not secrets.compare_digest(body.recovery_key, configured_key):
        raise HTTPException(status_code=401, detail="Invalid recovery credentials")

    user = db.query(User).filter(User.email == requested_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account exists for this email address")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="This account is inactive")

    return RecoveryStartResponse(
        reset_token=create_password_reset_token(user.id, user.password_hash)
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id, expected_fingerprint = decode_password_reset_token(body.reset_token)
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="This recovery link is no longer valid")
    if not secrets.compare_digest(password_hash_fingerprint(user.password_hash), expected_fingerprint):
        raise HTTPException(status_code=400, detail="This recovery link has already been used")

    user.password_hash = hash_password(body.new_password)
    db.add(user)
    db.commit()
    return MessageResponse(message="Password updated. You can now sign in with your new password.")


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user
