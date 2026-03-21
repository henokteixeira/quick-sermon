import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, TimestampMixin, UUIDMixin
from app.modules.videos.enums import VideoStatus


class Video(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "videos"

    source_url: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    duration: Mapped[int | None] = mapped_column(Integer)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[VideoStatus] = mapped_column(default=VideoStatus.PENDING, nullable=False)
    youtube_video_id: Mapped[str | None] = mapped_column(String(50))

    # Timestamps (seconds)
    sermon_start: Mapped[int | None] = mapped_column(Integer)
    sermon_end: Mapped[int | None] = mapped_column(Integer)
    confidence: Mapped[float | None] = mapped_column()

    # Generated content
    generated_titles: Mapped[str | None] = mapped_column(Text)  # JSON array
    selected_title: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    whatsapp_message: Mapped[str | None] = mapped_column(Text)

    # Relations
    submitted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    workflow_id: Mapped[str | None] = mapped_column(String(255))
