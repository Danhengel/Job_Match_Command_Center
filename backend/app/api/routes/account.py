import logging
from pathlib import Path
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.db.base import Base
from app.db.session import get_db
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.user import User
from app.schemas.account import (
    AccountResponse,
    AccountUpdateRequest,
    AccountUpdateResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountRequest,
    NotificationPreferences,
)
from app.schemas.auth import MessageResponse
from app.services.email_service import send_password_changed_email, send_verification_email
from app.api.routes.auth import _frontend_link, _issue_account_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/account", tags=["Account"])
RESUME_STORAGE_ROOT = Path("/data/resumes")


def _notifications(user: User) -> NotificationPreferences:
    return NotificationPreferences(
        job_matches=user.notify_job_matches,
        high_match=user.notify_high_match,
        application_reminders=user.notify_application_reminders,
        interview_reminders=user.notify_interview_reminders,
        resume_recommendations=user.notify_resume_recommendations,
        product_updates=user.notify_product_updates,
        promotions=user.notify_promotions,
    )


def _account(user: User) -> AccountResponse:
    return AccountResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        timezone=user.timezone,
        email_verified=bool(user.email_verified_at),
        email_verified_at=user.email_verified_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
        password_changed_at=user.password_changed_at,
        notifications=_notifications(user),
    )


def _json_safe(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, (Decimal, UUID)):
        return str(value)
    if isinstance(value, bytes):
        return "[binary data omitted]"
    return value


@router.get("", response_model=AccountResponse)
def get_account(user: User = Depends(get_current_user)):
    return _account(user)


@router.patch("", response_model=AccountUpdateResponse)
def update_account(
    body: AccountUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_token = None
    verification_token = None

    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.timezone is not None:
        user.timezone = body.timezone.strip()

    if body.email is not None:
        normalized_email = body.email.lower().strip()
        if normalized_email != user.email:
            if not body.current_password or not verify_password(
                body.current_password,
                user.password_hash,
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Your current password is required to change your email address",
                )
            existing = db.query(User).filter(
                User.email == normalized_email,
                User.id != user.id,
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail="Email is already registered")

            user.email = normalized_email
            user.email_verified_at = None
            user.auth_version = int(user.auth_version or 1) + 1
            verification_token = _issue_account_token(
                db,
                user=user,
                purpose="email_verification",
                lifetime_minutes=settings.email_verification_minutes,
                request_ip=None,
            )
            new_token = create_access_token(user.id, user.auth_version)

    db.commit()
    db.refresh(user)

    if verification_token:
        try:
            send_verification_email(
                user.email,
                _frontend_link("/verify-email", verification_token),
            )
        except Exception:
            logger.exception("Unable to send verification email for user %s", user.id)

    return AccountUpdateResponse(account=_account(user), access_token=new_token)


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if verify_password(body.new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="New password must be different")

    validate_password_strength(body.new_password)
    user.password_hash = hash_password(body.new_password)
    user.password_changed_at = datetime.utcnow()
    user.auth_version = int(user.auth_version or 1) + 1
    db.commit()

    try:
        send_password_changed_email(user.email)
    except Exception:
        logger.exception("Unable to send password changed email for user %s", user.id)

    return ChangePasswordResponse(
        message="Your password has been changed and other sessions were signed out.",
        access_token=create_access_token(user.id, user.auth_version),
    )


@router.patch("/notifications", response_model=AccountResponse)
def update_notifications(
    body: NotificationPreferences,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.notify_job_matches = body.job_matches
    user.notify_high_match = body.high_match
    user.notify_application_reminders = body.application_reminders
    user.notify_interview_reminders = body.interview_reminders
    user.notify_resume_recommendations = body.resume_recommendations
    user.notify_product_updates = body.product_updates
    user.notify_promotions = body.promotions
    db.commit()
    db.refresh(user)
    return _account(user)


@router.post("/logout-all", response_model=MessageResponse)
def logout_all(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.auth_version = int(user.auth_version or 1) + 1
    db.commit()
    return MessageResponse(message="All devices have been signed out.")


@router.get("/export")
def export_account_data(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    export = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "account": _account(user).model_dump(mode="json"),
        "data": {},
    }
    owned_ids: dict[str, set] = {"users": {user.id}}

    for table in Base.metadata.sorted_tables:
        if table.name in {"users", "password_reset_tokens"}:
            continue

        ownership_filters = []
        for foreign_key in table.foreign_keys:
            parent_table = foreign_key.column.table.name
            parent_ids = owned_ids.get(parent_table)
            if parent_ids:
                ownership_filters.append(foreign_key.parent.in_(parent_ids))

        if not ownership_filters:
            continue

        query = select(table).where(ownership_filters[0])
        for condition in ownership_filters[1:]:
            query = query.where(condition)
        rows = db.execute(query).mappings().all()
        if not rows:
            continue

        serializable_rows = []
        primary_key_names = [column.name for column in table.primary_key.columns]
        table_ids = set()
        for row in rows:
            record = {key: _json_safe(value) for key, value in dict(row).items()}
            serializable_rows.append(record)
            if len(primary_key_names) == 1:
                table_ids.add(row[primary_key_names[0]])

        export["data"][table.name] = serializable_rows
        if table_ids:
            owned_ids[table.name] = table_ids

    response = JSONResponse(export)
    response.headers["Content-Disposition"] = 'attachment; filename="careernaviq-account-data.json"'
    return response


@router.delete("", response_model=MessageResponse)
def delete_account(
    body: DeleteAccountRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    resume_files = [
        RESUME_STORAGE_ROOT / row.stored_filename
        for row in (
            db.query(Resume)
            .join(CareerProfile)
            .filter(CareerProfile.user_id == user.id)
            .all()
        )
    ]
    db.delete(user)
    db.commit()
    for path in resume_files:
        try:
            if path.exists():
                path.unlink()
        except OSError:
            logger.exception("Unable to remove stored resume after deleting user %s", user.id)
    return MessageResponse(message="Your CareerNavIQ account has been deleted.")
