"""Add job-search source coverage audit fields.

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
    op.add_column(
        "search_runs",
        sa.Column(
            "source_counts",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )
    op.add_column(
        "search_runs",
        sa.Column(
            "source_status",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    op.add_column(
        "search_runs",
        sa.Column(
            "coverage_notes",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )

    op.alter_column(
        "search_runs",
        "source_counts",
        server_default=None,
    )
    op.alter_column(
        "search_runs",
        "source_status",
        server_default=None,
    )
    op.alter_column(
        "search_runs",
        "coverage_notes",
        server_default=None,
    )


def downgrade():
    op.drop_column("search_runs", "coverage_notes")
    op.drop_column("search_runs", "source_status")
    op.drop_column("search_runs", "source_counts")
