"""create_youtube_tables

Revision ID: d5f9g2b34c8e
Revises: c4e8f1a23b7d
Create Date: 2026-03-29 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d5f9g2b34c8e"
down_revision: Union[str, None] = "c4e8f1a23b7d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "youtube_connections",
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("channel_id", sa.String(length=100), nullable=False),
        sa.Column("channel_title", sa.String(length=255), nullable=False),
        sa.Column("daily_quota_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("quota_reset_date", sa.String(length=10), nullable=True),
        sa.Column("connected_by", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["connected_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "youtube_uploads",
        sa.Column("clip_id", sa.UUID(), nullable=False),
        sa.Column("youtube_video_id", sa.String(length=50), nullable=True),
        sa.Column("youtube_url", sa.String(length=500), nullable=True),
        sa.Column("youtube_status", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("error_code", sa.String(length=50), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("uploaded_by", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["clip_id"], ["clips.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_youtube_uploads_clip_id", "youtube_uploads", ["clip_id"])


def downgrade() -> None:
    op.drop_index("ix_youtube_uploads_clip_id", table_name="youtube_uploads")
    op.drop_table("youtube_uploads")
    op.drop_table("youtube_connections")
