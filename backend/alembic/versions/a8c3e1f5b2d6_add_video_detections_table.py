"""add_video_detections_table

Revision ID: a8c3e1f5b2d6
Revises: f7b1d9a25e44
Create Date: 2026-04-20 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a8c3e1f5b2d6"
down_revision: Union[str, None] = "f7b1d9a25e44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_detections",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("video_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("method", sa.String(length=20), nullable=True),
        sa.Column("start_seconds", sa.Integer(), nullable=True),
        sa.Column("end_seconds", sa.Integer(), nullable=True),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("raw_fase_chapters", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("raw_fase_captions", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("raw_fase_vad", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("raw_fase_llm", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("temporal_workflow_id", sa.String(length=200), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_video_detections_video_id", "video_detections", ["video_id"])
    op.create_index("ix_video_detections_status", "video_detections", ["status"])


def downgrade() -> None:
    op.drop_index("ix_video_detections_status", table_name="video_detections")
    op.drop_index("ix_video_detections_video_id", table_name="video_detections")
    op.drop_table("video_detections")
