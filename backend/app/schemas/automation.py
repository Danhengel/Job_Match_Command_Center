from pydantic import BaseModel, Field, field_validator


class SavedSearchCreate(BaseModel):
    profile_id: int
    name: str = Field(min_length=2, max_length=255)
    titles: list[str] = Field(min_length=1)
    location: str = "Remote"
    minimum_score: int = Field(default=35, ge=0, le=100)
    use_catalog: bool = True
    use_remotive: bool = False
    use_jsearch: bool = True
    cadence: str = "daily"


class SavedSearchUpdate(BaseModel):
    name: str | None = None
    titles: list[str] | None = None
    location: str | None = None
    minimum_score: int | None = Field(default=None, ge=0, le=100)
    use_catalog: bool | None = None
    use_remotive: bool | None = None
    use_jsearch: bool | None = None
    active: bool | None = None
    cadence: str | None = None


class AutomationPreferenceUpdate(BaseModel):
    timezone: str | None = Field(default=None, min_length=3, max_length=100)
    daily_brief_enabled: bool | None = None
    daily_brief_hour: int | None = Field(default=None, ge=0, le=23)
    weekly_report_enabled: bool | None = None
    weekly_report_day: int | None = Field(default=None, ge=0, le=6)
    weekly_report_hour: int | None = Field(default=None, ge=0, le=23)
    interview_reminder_hours: list[int] | None = None
    application_follow_up_days: int | None = Field(default=None, ge=1, le=30)
    job_alert_frequency: str | None = None
    default_search_cadence: str | None = None
    quiet_hours_start: int | None = Field(default=None, ge=0, le=23)
    quiet_hours_end: int | None = Field(default=None, ge=0, le=23)
    notification_categories: dict[str, bool] | None = None

    @field_validator("interview_reminder_hours")
    @classmethod
    def validate_reminder_hours(cls, value):
        if value is None:
            return value
        cleaned = sorted(set(value), reverse=True)
        if not cleaned or any(hour < 1 or hour > 168 for hour in cleaned):
            raise ValueError("Reminder hours must be between 1 and 168")
        return cleaned

    @field_validator("job_alert_frequency", "default_search_cadence")
    @classmethod
    def validate_frequency(cls, value):
        if value is None:
            return value
        allowed = {"instant", "twice_daily", "daily", "weekdays", "weekly", "manual"}
        if value not in allowed:
            raise ValueError("Unsupported frequency")
        return value
