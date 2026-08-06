"""Add job freshness verification fields.

Revision ID: 0015
Revises: 0014
"""

from alembic import op
import sqlalchemy as sa


revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "jobs",
        sa.Column("verified_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column("closed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "verification_status",
            sa.String(length=50),
            nullable=False,
            server_default="unverified",
        ),
    )
    op.alter_column("jobs", "verification_status", server_default=None)
    op.create_index(
        "ix_jobs_verification_status",
        "jobs",
        ["verification_status"],
        unique=False,
    )
    op.create_index(
        "ix_jobs_active_verified_at",
        "jobs",
        ["active", "verified_at"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_jobs_active_verified_at", table_name="jobs")
    op.drop_index("ix_jobs_verification_status", table_name="jobs")
    op.drop_column("jobs", "verification_status")
    op.drop_column("jobs", "closed_at")
    op.drop_column("jobs", "verified_at")
