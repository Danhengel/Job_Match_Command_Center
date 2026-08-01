"""career intelligence, company watches, and coach history"""
from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "application_packages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "application_id",
            sa.Integer(),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("fit_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "fit_recommendation",
            sa.String(length=100),
            nullable=False,
            server_default="",
        ),
        sa.Column("fit_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("strengths", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("gaps", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column(
            "executive_summary", sa.Text(), nullable=False, server_default=""
        ),
        sa.Column(
            "recruiter_email", sa.Text(), nullable=False, server_default=""
        ),
        sa.Column(
            "linkedin_message", sa.Text(), nullable=False, server_default=""
        ),
        sa.Column(
            "plan_30_60_90", sa.JSON(), nullable=False, server_default="[]"
        ),
        sa.Column(
            "salary_strategy", sa.JSON(), nullable=False, server_default="[]"
        ),
        sa.Column("generated_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("application_id", name="uq_application_package"),
    )
    op.create_index(
        "ix_application_packages_user_id",
        "application_packages",
        ["user_id"],
    )
    op.create_index(
        "ix_application_packages_application_id",
        "application_packages",
        ["application_id"],
    )

    op.create_table(
        "company_watches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("company", sa.String(length=500), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint(
            "user_id", "company", name="uq_user_company_watch"
        ),
    )
    op.create_index(
        "ix_company_watches_user_id",
        "company_watches",
        ["user_id"],
    )
    op.create_index(
        "ix_company_watches_company",
        "company_watches",
        ["company"],
    )

    op.create_table(
        "career_coach_messages",
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
            sa.ForeignKey("career_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "application_id",
            sa.Integer(),
            sa.ForeignKey("applications.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_career_coach_messages_user_id",
        "career_coach_messages",
        ["user_id"],
    )


def downgrade():
    op.drop_table("career_coach_messages")
    op.drop_table("company_watches")
    op.drop_table("application_packages")
