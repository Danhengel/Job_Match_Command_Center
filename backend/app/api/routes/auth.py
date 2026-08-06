import hashlib
import logging
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.db.session import get_db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.email_service import (
    send_password_changed_email,
    send_password_reset_email,
    send_verification_email,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
GENERIC_RESET_MESSAGE = "If an account exists for that email, a reset link has been sent."


def _token_hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _request_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if forwarded:
        return forwarded[:64]
    return request.client.host[:64] if request.client else None


def _issue_account_token(
    db: Session,
    *,
    user: User,
    purpose: str,
    lifetime_minutes: int,
    request_ip: str | None,
) -> str:
    now = datetime.utcnow()
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.purpose == purpose,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)

    raw_token = secrets.token_urlsafe(48)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_token_hash(raw_token),
            purpose=purpose,
            expires_at=now + timedelta(minutes=lifetime_minutes),
            request_ip=request_ip,
        )
    )
    return raw_token


def _consume_account_token(
    db: Session,
    *,
    raw_token: str,
    purpose: str,
) -> PasswordResetToken:
    now = datetime.utcnow()
    token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == _token_hash(raw_token),
            PasswordResetToken.purpose == purpose,
            PasswordResetToken.used_at.is_(None),
        )
        .with_for_update()
        .first()
    )
    if not token:
        raise HTTPException(status_code=400, detail="This link is invalid or has already been used")
    if token.expires_at <= now:
        token.used_at = now
        db.commit()
        raise HTTPException(status_code=410, detail="This link has expired")
    return token


def _frontend_link(path: str, token: str) -> str:
    return f"{settings.frontend_url.rstrip('/')}{path}?token={token}"


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    validate_password_strength(body.password)
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        email=email,
        full_name=body.full_name.strip(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.flush()
    verification_token = _issue_account_token(
        db,
        user=user,
        purpose="email_verification",
        lifetime_minutes=settings.email_verification_minutes,
        request_ip=_request_ip(request),
    )
    db.commit()
    db.refresh(user)

    try:
        send_verification_email(
            user.email,
            _frontend_link("/verify-email", verification_token),
        )
    except Exception:
        logger.exception("Unable to send verification email for user %s", user.id)

    return TokenResponse(
        access_token=create_access_token(user.id, user.auth_version),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or missing")

    user.last_login_at = datetime.utcnow()
    db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id, user.auth_version),
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not user.is_active:
        return MessageResponse(message=GENERIC_RESET_MESSAGE)

    raw_token = _issue_account_token(
        db,
        user=user,
        purpose="password_reset",
        lifetime_minutes=settings.password_reset_minutes,
        request_ip=_request_ip(request),
    )
    db.commit()

    try:
        send_password_reset_email(
            user.email,
            _frontend_link("/reset-password", raw_token),
        )
    except Exception:
        logger.exception("Unable to send password reset email for user %s", user.id)
        now = datetime.utcnow()
        db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == _token_hash(raw_token)
        ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
        db.commit()

    return MessageResponse(message=GENERIC_RESET_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    validate_password_strength(body.password)
    token = _consume_account_token(
        db,
        raw_token=body.token,
        purpose="password_reset",
    )
    user = db.get(User, token.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="This link is no longer valid")
    if verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=400, detail="New password must be different")

    now = datetime.utcnow()
    user.password_hash = hash_password(body.password)
    user.password_changed_at = now
    user.auth_version = int(user.auth_version or 1) + 1
    token.used_at = now
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
    db.commit()

    try:
        send_password_changed_email(user.email)
    except Exception:
        logger.exception("Unable to send password changed email for user %s", user.id)

    return MessageResponse(message="Your password has been updated. You can now sign in.")


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.email_verified_at:
        return MessageResponse(message="Your email address is already verified.")

    raw_token = _issue_account_token(
        db,
        user=user,
        purpose="email_verification",
        lifetime_minutes=settings.email_verification_minutes,
        request_ip=_request_ip(request),
    )
    db.commit()
    try:
        send_verification_email(
            user.email,
            _frontend_link("/verify-email", raw_token),
        )
    except Exception:
        logger.exception("Unable to resend verification email for user %s", user.id)
        raise HTTPException(status_code=503, detail="Verification email could not be sent")
    return MessageResponse(message="A verification email has been sent.")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    token = _consume_account_token(
        db,
        raw_token=body.token,
        purpose="email_verification",
    )
    user = db.get(User, token.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="This link is no longer valid")

    now = datetime.utcnow()
    user.email_verified_at = now
    token.used_at = now
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.purpose == "email_verification",
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
    db.commit()
    return MessageResponse(message="Your email address has been verified.")


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user
