"""add_pipeline_and_workflow_tracking_to_clips

Revision ID: f7b1d9a25e44
Revises: e6a0f4c18d92
Create Date: 2026-04-18 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7b1d9a25e44"
down_revision: Union[str, None] = "e6a0f4c18d92"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "clips",
        sa.Column("downloaded_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "clips",
        sa.Column("trimmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "clips",
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "clips",
        sa.Column("temporal_workflow_id", sa.String(length=200), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("clips", "temporal_workflow_id")
    op.drop_column("clips", "uploaded_at")
    op.drop_column("clips", "trimmed_at")
    op.drop_column("clips", "downloaded_at")
