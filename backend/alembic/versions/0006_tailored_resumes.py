"""tailored resumes and cover letters"""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "tailored_resumes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "profile_id",
            sa.Integer(),
            sa.ForeignKey("career_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "resume_id",
            sa.Integer(),
            sa.ForeignKey("resumes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "job_id",
            sa.Integer(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version_name", sa.String(length=255), nullable=False),
        sa.Column("ats_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "professional_summary",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
        sa.Column("tailored_text", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "selected_evidence",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "matched_keywords",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "missing_keywords",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "recommendations",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("cover_letter", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_tailored_resumes_user_id",
        "tailored_resumes",
        ["user_id"],
    )
    op.create_index(
        "ix_tailored_resumes_profile_id",
        "tailored_resumes",
        ["profile_id"],
    )
    op.create_index(
        "ix_tailored_resumes_resume_id",
        "tailored_resumes",
        ["resume_id"],
    )
    op.create_index(
        "ix_tailored_resumes_job_id",
        "tailored_resumes",
        ["job_id"],
    )


def downgrade():
    op.drop_table("tailored_resumes")
