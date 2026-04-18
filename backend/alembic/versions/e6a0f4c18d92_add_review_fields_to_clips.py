"""add_review_fields_to_clips

Revision ID: e6a0f4c18d92
Revises: d5f9g2b34c8e
Create Date: 2026-04-18 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e6a0f4c18d92"
down_revision: Union[str, None] = "d5f9g2b34c8e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "clips",
        sa.Column("generated_titles", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("clips", sa.Column("generated_description", sa.Text(), nullable=True))
    op.add_column("clips", sa.Column("generated_whatsapp_message", sa.Text(), nullable=True))
    op.add_column("clips", sa.Column("selected_title", sa.String(length=100), nullable=True))
    op.add_column("clips", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("clips", sa.Column("whatsapp_message", sa.Text(), nullable=True))
    op.add_column(
        "clips",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "clips",
        sa.Column("discarded_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("clips", "discarded_at")
    op.drop_column("clips", "published_at")
    op.drop_column("clips", "whatsapp_message")
    op.drop_column("clips", "description")
    op.drop_column("clips", "selected_title")
    op.drop_column("clips", "generated_whatsapp_message")
    op.drop_column("clips", "generated_description")
    op.drop_column("clips", "generated_titles")
