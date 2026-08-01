"""enterprise command center and career page watches"""
from alembic import op
import sqlalchemy as sa
revision="0011"
down_revision="0010"
branch_labels=None
depends_on=None

def upgrade():
    op.create_table("command_center_snapshots",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("metrics",sa.JSON(),nullable=False,server_default="{}"),sa.Column("priorities",sa.JSON(),nullable=False,server_default="[]"),sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_index("ix_command_center_snapshots_user_id","command_center_snapshots",["user_id"])
    op.create_table("career_page_watches",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("company",sa.String(length=500),nullable=False),sa.Column("career_url",sa.String(length=1000),nullable=False),sa.Column("ats_type",sa.String(length=100),nullable=False,server_default="unknown"),sa.Column("board_identifier",sa.String(length=500),nullable=False,server_default=""),sa.Column("active",sa.Boolean(),nullable=False,server_default=sa.true()),sa.Column("notes",sa.Text(),nullable=False,server_default=""),sa.Column("last_checked_at",sa.DateTime(),nullable=True),sa.Column("last_job_count",sa.Integer(),nullable=False,server_default="0"),sa.Column("last_error",sa.Text(),nullable=False,server_default=""),sa.Column("created_at",sa.DateTime(),nullable=False),sa.UniqueConstraint("user_id","company","career_url",name="uq_user_company_career_watch"))
    op.create_index("ix_career_page_watches_user_id","career_page_watches",["user_id"])
    op.create_index("ix_career_page_watches_company","career_page_watches",["company"])
    op.create_table("package_exports",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("application_id",sa.Integer(),sa.ForeignKey("applications.id",ondelete="CASCADE"),nullable=False),sa.Column("package_type",sa.String(length=100),nullable=False,server_default="executive"),sa.Column("manifest",sa.JSON(),nullable=False,server_default="{}"),sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_index("ix_package_exports_user_id","package_exports",["user_id"])
    op.create_index("ix_package_exports_application_id","package_exports",["application_id"])

def downgrade():
    op.drop_table("package_exports")
    op.drop_table("career_page_watches")
    op.drop_table("command_center_snapshots")
