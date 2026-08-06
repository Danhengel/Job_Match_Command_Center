import html
import logging
from uuid import uuid4

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)
RESEND_EMAILS_URL = "https://api.resend.com/emails"


def _send_email(*, to: str, subject: str, html_body: str, text_body: str) -> None:
    if not settings.email_api_key:
        if settings.environment.lower() == "production":
            raise RuntimeError("EMAIL_API_KEY is required in production")
        logger.warning("Email delivery is disabled. Intended recipient: %s; subject: %s", to, subject)
        return

    response = requests.post(
        RESEND_EMAILS_URL,
        headers={
            "Authorization": f"Bearer {settings.email_api_key}",
            "Content-Type": "application/json",
            "Idempotency-Key": str(uuid4()),
        },
        json={
            "from": settings.email_from,
            "to": [to],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        },
        timeout=15,
    )
    response.raise_for_status()


def send_password_reset_email(email: str, reset_url: str) -> None:
    safe_url = html.escape(reset_url, quote=True)
    _send_email(
        to=email,
        subject="Reset your CareerNavIQ password",
        html_body=(
            "<p>We received a request to reset your CareerNavIQ password.</p>"
            f'<p><a href="{safe_url}">Create a new password</a></p>'
            f"<p>This link expires in {settings.password_reset_minutes} minutes and can be used once.</p>"
            "<p>If you did not request this, you can safely ignore this email.</p>"
        ),
        text_body=(
            "We received a request to reset your CareerNavIQ password.\n\n"
            f"Create a new password: {reset_url}\n\n"
            f"This link expires in {settings.password_reset_minutes} minutes and can be used once."
        ),
    )


def send_password_changed_email(email: str) -> None:
    _send_email(
        to=email,
        subject="Your CareerNavIQ password was changed",
        html_body=(
            "<p>Your CareerNavIQ password was changed successfully.</p>"
            "<p>If you did not make this change, request another password reset immediately.</p>"
        ),
        text_body=(
            "Your CareerNavIQ password was changed successfully. "
            "If you did not make this change, request another password reset immediately."
        ),
    )


def send_verification_email(email: str, verification_url: str) -> None:
    safe_url = html.escape(verification_url, quote=True)
    _send_email(
        to=email,
        subject="Verify your CareerNavIQ email address",
        html_body=(
            "<p>Verify your email address to secure your CareerNavIQ account.</p>"
            f'<p><a href="{safe_url}">Verify email address</a></p>'
            f"<p>This link expires in {settings.email_verification_minutes // 60} hours and can be used once.</p>"
        ),
        text_body=(
            "Verify your CareerNavIQ email address:\n\n"
            f"{verification_url}\n\n"
            f"This link expires in {settings.email_verification_minutes // 60} hours."
        ),
    )
