"""recruiter CRM, interview calendar, and salary plans"""
from alembic import op
import sqlalchemy as sa

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "recruiter_contacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company", sa.String(length=500), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("email", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("phone", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("linkedin_url", sa.String(length=1000), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=100), nullable=False, server_default="new"),
        sa.Column("relationship_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("last_contact_at", sa.DateTime(), nullable=True),
        sa.Column("next_follow_up_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_recruiter_contacts_user_id", "recruiter_contacts", ["user_id"])
    op.create_index("ix_recruiter_contacts_company", "recruiter_contacts", ["company"])

    op.create_table(
        "interview_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False, server_default="interview"),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=True),
        sa.Column("location", sa.String(length=1000), nullable=False, server_default=""),
        sa.Column("meeting_url", sa.String(length=1000), nullable=False, server_default=""),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("reminder_minutes", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_interview_events_user_id", "interview_events", ["user_id"])
    op.create_index("ix_interview_events_application_id", "interview_events", ["application_id"])

    op.create_table(
        "salary_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_base", sa.Integer(), nullable=True),
        sa.Column("minimum_base", sa.Integer(), nullable=True),
        sa.Column("target_bonus_pct", sa.Integer(), nullable=True),
        sa.Column("total_comp_target", sa.Integer(), nullable=True),
        sa.Column("rationale", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("negotiation_points", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("application_id", name="uq_salary_plan_application"),
    )
    op.create_index("ix_salary_plans_user_id", "salary_plans", ["user_id"])
    op.create_index("ix_salary_plans_application_id", "salary_plans", ["application_id"])


def downgrade():
    op.drop_table("salary_plans")
    op.drop_table("interview_events")
    op.drop_table("recruiter_contacts")
