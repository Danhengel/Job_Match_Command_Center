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
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_key: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), index=True)
    company: Mapped[str] = mapped_column(String(500), index=True)
    location: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(100))
    posted_at: Mapped[str] = mapped_column(String(100), default="")
    salary: Mapped[str] = mapped_column(String(255), default="")
    employment_type: Mapped[str] = mapped_column(
        Text,
        default="",
    )
    remote: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    first_seen: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    verification_status: Mapped[str] = mapped_column(
        String(50),
        default="unverified",
        index=True,
    )


class JobMatch(Base):
    __tablename__ = "job_matches"
    __table_args__ = (
        UniqueConstraint(
            "profile_id",
            "job_id",
            name="uq_profile_job_match",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        index=True,
    )
    score: Mapped[int] = mapped_column(Integer)
    title_score: Mapped[int] = mapped_column(Integer, default=0)
    keyword_score: Mapped[int] = mapped_column(Integer, default=0)
    location_score: Mapped[int] = mapped_column(Integer, default=0)
    resume_score: Mapped[int] = mapped_column(Integer, default=0)
    matched_keywords: Mapped[list] = mapped_column(JSON, default=list)
    missing_keywords: Mapped[list] = mapped_column(JSON, default=list)
    concerns: Mapped[list] = mapped_column(JSON, default=list)
    explanation: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class SearchRun(Base):
    __tablename__ = "search_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    profile_id: Mapped[int] = mapped_column(
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    searched_sources: Mapped[list] = mapped_column(JSON, default=list)
    query_titles: Mapped[list] = mapped_column(JSON, default=list)
    raw_count: Mapped[int] = mapped_column(Integer, default=0)
    unique_count: Mapped[int] = mapped_column(Integer, default=0)
    matched_count: Mapped[int] = mapped_column(Integer, default=0)
    minimum_score: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[list] = mapped_column(JSON, default=list)
    source_counts: Mapped[dict] = mapped_column(JSON, default=dict)
    source_status: Mapped[list] = mapped_column(JSON, default=list)
    coverage_notes: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

