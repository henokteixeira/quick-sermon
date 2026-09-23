"""drop_upload_counter_from_youtube_connections

Revision ID: 129aee717540
Revises: a8c3e1f5b2d6
Create Date: 2026-09-23 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "129aee717540"
down_revision: Union[str, None] = "a8c3e1f5b2d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("youtube_connections", "quota_reset_date")
    op.drop_column("youtube_connections", "daily_quota_used")


def downgrade() -> None:
    op.add_column(
        "youtube_connections",
        sa.Column("daily_quota_used", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "youtube_connections",
        sa.Column("quota_reset_date", sa.String(length=10), nullable=True),
    )
