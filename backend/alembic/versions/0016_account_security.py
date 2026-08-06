"""Add account recovery and security fields.

Revision ID: 0016
Revises: 0015
"""

from alembic import op
import sqlalchemy as sa


revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("updated_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("password_changed_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))
    op.add_column(
        "users",
        sa.Column("auth_version", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "users",
        sa.Column("timezone", sa.String(length=100), nullable=False, server_default="America/New_York"),
    )
    op.add_column(
        "users",
        sa.Column("notify_job_matches", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column("notify_high_match", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column("notify_application_reminders", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column("notify_interview_reminders", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column("notify_resume_recommendations", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column("notify_product_updates", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "users",
        sa.Column("notify_promotions", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
    op.alter_column("users", "updated_at", nullable=False)

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("purpose", sa.String(length=40), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("request_ip", sa.String(length=64), nullable=True),
    )
    op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"])
    op.create_index(
        "ix_password_reset_tokens_token_hash",
        "password_reset_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index("ix_password_reset_tokens_purpose", "password_reset_tokens", ["purpose"])
    op.create_index("ix_password_reset_tokens_expires_at", "password_reset_tokens", ["expires_at"])


def downgrade():
    op.drop_index("ix_password_reset_tokens_expires_at", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_purpose", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_token_hash", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_user_id", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")

    op.drop_column("users", "notify_promotions")
    op.drop_column("users", "notify_product_updates")
    op.drop_column("users", "notify_resume_recommendations")
    op.drop_column("users", "notify_interview_reminders")
    op.drop_column("users", "notify_application_reminders")
    op.drop_column("users", "notify_high_match")
    op.drop_column("users", "notify_job_matches")
    op.drop_column("users", "timezone")
    op.drop_column("users", "auth_version")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "password_changed_at")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "updated_at")
