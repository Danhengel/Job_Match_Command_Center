"""resume studio editing and version history"""

from alembic import op
import sqlalchemy as sa


revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "resumes",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.execute(
        "UPDATE resumes SET updated_at = created_at "
        "WHERE updated_at IS NULL"
    )

    op.alter_column(
        "resumes",
        "updated_at",
        existing_type=sa.DateTime(),
        nullable=False,
    )

    op.create_table(
        "resume_versions",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "resume_id",
            sa.Integer(),
            sa.ForeignKey(
                "resumes.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "version_number",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "resume_text",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "analysis_score",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "change_note",
            sa.String(length=500),
            nullable=False,
            server_default="Manual save",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_resume_versions_resume_id",
        "resume_versions",
        ["resume_id"],
    )

    op.create_unique_constraint(
        "uq_resume_version_number",
        "resume_versions",
        ["resume_id", "version_number"],
    )


def downgrade():
    op.drop_constraint(
        "uq_resume_version_number",
        "resume_versions",
        type_="unique",
    )
    op.drop_index(
        "ix_resume_versions_resume_id",
        table_name="resume_versions",
    )
    op.drop_table("resume_versions")
    op.drop_column("resumes", "updated_at")
    