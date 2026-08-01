"""resume analysis fields"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("resumes", sa.Column("analysis_score", sa.Integer(), nullable=True))
    op.add_column("resumes", sa.Column("strengths", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("resumes", sa.Column("gaps", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("resumes", sa.Column("metrics_found", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("resumes", sa.Column("analysis_summary", sa.Text(), nullable=False, server_default=""))
    op.add_column("resumes", sa.Column("analyzed_at", sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column("resumes", "analyzed_at")
    op.drop_column("resumes", "analysis_summary")
    op.drop_column("resumes", "metrics_found")
    op.drop_column("resumes", "gaps")
    op.drop_column("resumes", "strengths")
    op.drop_column("resumes", "analysis_score")
