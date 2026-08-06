from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


class NotificationPreferences(BaseModel):
    job_matches: bool
    high_match: bool
    application_reminders: bool
    interview_reminders: bool
    resume_recommendations: bool
    product_updates: bool
    promotions: bool


class AccountResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    timezone: str
    email_verified: bool
    email_verified_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None
    password_changed_at: datetime | None
    notifications: NotificationPreferences


class AccountUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    email: EmailStr | None = None
    timezone: str | None = Field(default=None, min_length=2, max_length=100)
    current_password: str | None = Field(default=None, min_length=1, max_length=256)


class AccountUpdateResponse(BaseModel):
    account: AccountResponse
    access_token: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=8, max_length=256)
    confirm_password: str = Field(min_length=8, max_length=256)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class ChangePasswordResponse(BaseModel):
    message: str
    access_token: str


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1, max_length=256)
    confirmation: Literal["DELETE"]
