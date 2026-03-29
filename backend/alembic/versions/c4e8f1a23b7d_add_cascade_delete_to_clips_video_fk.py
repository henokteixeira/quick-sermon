"""add_cascade_delete_to_clips_video_fk

Revision ID: c4e8f1a23b7d
Revises: b3f7a2c91d4e
Create Date: 2026-03-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "c4e8f1a23b7d"
down_revision: Union[str, None] = "b3f7a2c91d4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("clips_video_id_fkey", "clips", type_="foreignkey")
    op.create_foreign_key(
        "clips_video_id_fkey", "clips", "videos", ["video_id"], ["id"], ondelete="CASCADE"
    )


def downgrade() -> None:
    op.drop_constraint("clips_video_id_fkey", "clips", type_="foreignkey")
    op.create_foreign_key(
        "clips_video_id_fkey", "clips", "videos", ["video_id"], ["id"]
    )
