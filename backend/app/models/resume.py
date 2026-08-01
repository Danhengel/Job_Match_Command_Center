from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(primary_key=True)

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255))

    original_filename: Mapped[str] = mapped_column(String(255))

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        unique=True,
    )

    mime_type: Mapped[str] = mapped_column(String(120))

    file_size: Mapped[int] = mapped_column(Integer)

    extracted_text: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    analysis_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    strengths: Mapped[list] = mapped_column(
        JSON,
        default=list,
    )

    gaps: Mapped[list] = mapped_column(
        JSON,
        default=list,
    )

    metrics_found: Mapped[list] = mapped_column(
        JSON,
        default=list,
    )

    analysis_summary: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    profile: Mapped["CareerProfile"] = relationship(
        back_populates="resumes",
    )

    versions: Mapped[list["ResumeVersion"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    __table_args__ = (
        UniqueConstraint(
            "resume_id",
            "version_number",
            name="uq_resume_version_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    resume_id: Mapped[int] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"),
        index=True,
    )

    version_number: Mapped[int] = mapped_column(Integer)

    name: Mapped[str] = mapped_column(String(255))

    resume_text: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    analysis_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    change_note: Mapped[str] = mapped_column(
        String(500),
        default="Manual save",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    resume: Mapped["Resume"] = relationship(
        back_populates="versions",
    )