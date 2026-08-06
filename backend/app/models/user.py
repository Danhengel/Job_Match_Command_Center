from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    auth_version: Mapped[int] = mapped_column(Integer, default=1)
    timezone: Mapped[str] = mapped_column(String(100), default="America/New_York")

    notify_job_matches: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_high_match: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_application_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_interview_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_resume_recommendations: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_product_updates: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_promotions: Mapped[bool] = mapped_column(Boolean, default=False)

    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
