"""applications and interview prep"""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("career_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tailoring_id", sa.Integer(), sa.ForeignKey("tailored_resumes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="wishlist"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="normal"),
        sa.Column("recruiter_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("recruiter_email", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("salary_target", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("next_action", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("next_action_at", sa.DateTime(), nullable=True),
        sa.Column("applied_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "job_id", name="uq_user_job_application"),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_profile_id", "applications", ["profile_id"])
    op.create_index("ix_applications_job_id", "applications", ["job_id"])
    op.create_index("ix_applications_status", "applications", ["status"])

    op.create_table(
        "interview_preps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("opening_statement", sa.Text(), nullable=False, server_default=""),
        sa.Column("questions", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("star_prompts", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("questions_to_ask", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("negotiation_points", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("thank_you_email", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_interview_preps_user_id", "interview_preps", ["user_id"])
    op.create_index("ix_interview_preps_application_id", "interview_preps", ["application_id"])


def downgrade():
    op.drop_table("interview_preps")
    op.drop_table("applications")
