from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, reconstructor, validates
from app.db.base import Base


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("career_profiles.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    titles: Mapped[list] = mapped_column(JSON, default=list)
    location: Mapped[str] = mapped_column(String(500), default="Remote")
    minimum_score: Mapped[int] = mapped_column(Integer, default=35)
    use_catalog: Mapped[bool] = mapped_column(Boolean, default=True)
    use_remotive: Mapped[bool] = mapped_column(Boolean, default=True)
    use_jsearch: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    cadence: Mapped[str] = mapped_column(String(50), default="daily")
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_result_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @reconstructor
    def _enforce_maximum_coverage_on_load(self):
        self.use_catalog = True
        self.use_remotive = True
        self.use_jsearch = True

    @validates("use_catalog", "use_remotive", "use_jsearch")
    def _enforce_maximum_coverage(self, key, value):
        return True


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(500))
    message: Mapped[str] = mapped_column(Text)
    link: Mapped[str] = mapped_column(String(1000), default="")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    saved_search_id: Mapped[int] = mapped_column(ForeignKey("saved_searches.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="completed")
    new_job_count: Mapped[int] = mapped_column(Integer, default=0)
    matched_job_count: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[list] = mapped_column(JSON, default=list)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AutomationPreference(Base):
    __tablename__ = "automation_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    timezone: Mapped[str] = mapped_column(String(100), default="America/New_York")
    daily_brief_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    daily_brief_hour: Mapped[int] = mapped_column(Integer, default=8)
    weekly_report_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    weekly_report_day: Mapped[int] = mapped_column(Integer, default=1)
    weekly_report_hour: Mapped[int] = mapped_column(Integer, default=8)
    interview_reminder_hours: Mapped[list] = mapped_column(JSON, default=lambda: [48, 24])
    application_follow_up_days: Mapped[int] = mapped_column(Integer, default=7)
    job_alert_frequency: Mapped[str] = mapped_column(String(50), default="daily")
    default_search_cadence: Mapped[str] = mapped_column(String(50), default="daily")
    quiet_hours_start: Mapped[int] = mapped_column(Integer, default=21)
    quiet_hours_end: Mapped[int] = mapped_column(Integer, default=7)
    notification_categories: Mapped[dict] = mapped_column(JSON, default=lambda: {"jobs": True, "applications": True, "recruiters": True, "interviews": True})
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
