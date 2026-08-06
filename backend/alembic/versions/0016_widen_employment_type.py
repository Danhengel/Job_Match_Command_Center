"""Widen employment_type column to handle long provider values like 'Remote OK'"""
from alembic import op
import sqlalchemy as sa

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None

def upgrade():
    # Alter employment_type column from String(100) to Text
    op.alter_column(
        'jobs',
        'employment_type',
        existing_type=sa.String(length=100),
        type_=sa.Text(),
        existing_nullable=False,
        existing_server_default='',
    )

def downgrade():
    # Revert to String(100) if needed
    op.alter_column(
        'jobs',
        'employment_type',
        existing_type=sa.Text(),
        type_=sa.String(length=100),
        existing_nullable=False,
        existing_server_default='',
    )

