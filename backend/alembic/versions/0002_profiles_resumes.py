"""career profiles and resumes"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("career_profiles",
        sa.Column("id",sa.Integer(),primary_key=True),
        sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),
        sa.Column("name",sa.String(255),nullable=False),sa.Column("home_location",sa.String(255),nullable=False,server_default=""),
        sa.Column("remote_preferred",sa.Boolean(),nullable=False,server_default=sa.true()),
        sa.Column("hybrid_preferred",sa.Boolean(),nullable=False,server_default=sa.true()),
        sa.Column("radius_miles",sa.Integer(),nullable=False,server_default="50"),
        sa.Column("salary_min",sa.Integer(),nullable=True),sa.Column("salary_target",sa.Integer(),nullable=True),
        sa.Column("target_titles",sa.JSON(),nullable=False),sa.Column("priority_keywords",sa.JSON(),nullable=False),
        sa.Column("exclusion_keywords",sa.JSON(),nullable=False),sa.Column("created_at",sa.DateTime(),nullable=False),
        sa.Column("updated_at",sa.DateTime(),nullable=False))
    op.create_index("ix_career_profiles_user_id","career_profiles",["user_id"])
    op.create_table("resumes",
        sa.Column("id",sa.Integer(),primary_key=True),
        sa.Column("profile_id",sa.Integer(),sa.ForeignKey("career_profiles.id",ondelete="CASCADE"),nullable=False),
        sa.Column("name",sa.String(255),nullable=False),sa.Column("original_filename",sa.String(255),nullable=False),
        sa.Column("stored_filename",sa.String(255),nullable=False,unique=True),sa.Column("mime_type",sa.String(120),nullable=False),
        sa.Column("file_size",sa.Integer(),nullable=False),sa.Column("extracted_text",sa.Text(),nullable=False),
        sa.Column("is_primary",sa.Boolean(),nullable=False,server_default=sa.false()),sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_index("ix_resumes_profile_id","resumes",["profile_id"])

def downgrade():
    op.drop_table("resumes"); op.drop_table("career_profiles")
