"""Persist automation preferences.

Revision ID: 0013
Revises: 0012
"""

from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "automation_preferences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("timezone", sa.String(length=100), nullable=False, server_default="America/New_York"),
        sa.Column("daily_brief_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("daily_brief_hour", sa.Integer(), nullable=False, server_default="8"),
        sa.Column("weekly_report_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("weekly_report_day", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("weekly_report_hour", sa.Integer(), nullable=False, server_default="8"),
        sa.Column("interview_reminder_hours", sa.JSON(), nullable=False),
        sa.Column("application_follow_up_days", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("job_alert_frequency", sa.String(length=50), nullable=False, server_default="daily"),
        sa.Column("default_search_cadence", sa.String(length=50), nullable=False, server_default="daily"),
        sa.Column("quiet_hours_start", sa.Integer(), nullable=False, server_default="21"),
        sa.Column("quiet_hours_end", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("notification_categories", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", name="uq_automation_preferences_user"),
    )
    op.create_index("ix_automation_preferences_user_id", "automation_preferences", ["user_id"], unique=True)


def downgrade():
    op.drop_index("ix_automation_preferences_user_id", table_name="automation_preferences")
    op.drop_table("automation_preferences")
