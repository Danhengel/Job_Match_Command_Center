"""jobs and job matches"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider_key", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("company", sa.String(length=500), nullable=False),
        sa.Column("location", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("url", sa.Text(), nullable=False, server_default=""),
        sa.Column("source", sa.String(length=100), nullable=False),
        sa.Column("posted_at", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("salary", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("employment_type", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("remote", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("first_seen", sa.DateTime(), nullable=False),
        sa.Column("last_seen", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_jobs_provider_key","jobs",["provider_key"],unique=True)
    op.create_index("ix_jobs_title","jobs",["title"])
    op.create_index("ix_jobs_company","jobs",["company"])

    op.create_table(
        "job_matches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("career_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("title_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("keyword_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("location_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("resume_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("matched_keywords", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("missing_keywords", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("concerns", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("explanation", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("profile_id","job_id",name="uq_profile_job_match"),
    )
    op.create_index("ix_job_matches_profile_id","job_matches",["profile_id"])
    op.create_index("ix_job_matches_job_id","job_matches",["job_id"])

def downgrade():
    op.drop_table("job_matches")
    op.drop_table("jobs")
