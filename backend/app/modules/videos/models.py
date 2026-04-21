import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, TimestampMixin, UUIDMixin
from app.modules.videos.enums import VideoStatus


class Video(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "videos"

    source_url: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    duration: Mapped[int | None] = mapped_column(Integer)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default=VideoStatus.PENDING, nullable=False)
    youtube_video_id: Mapped[str | None] = mapped_column(String(50))
    channel_name: Mapped[str | None] = mapped_column(String(255))
    view_count: Mapped[int | None] = mapped_column(Integer)
    upload_date: Mapped[str | None] = mapped_column(String(10))

    submitted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )


class VideoDetection(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "video_detections"

    video_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    method: Mapped[str | None] = mapped_column(String(20))
    start_seconds: Mapped[int | None] = mapped_column(Integer)
    end_seconds: Mapped[int | None] = mapped_column(Integer)
    confidence: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)
    raw_fase_chapters: Mapped[dict | None] = mapped_column(JSONB)
    raw_fase_captions: Mapped[dict | None] = mapped_column(JSONB)
    raw_fase_vad: Mapped[dict | None] = mapped_column(JSONB)
    raw_fase_llm: Mapped[dict | None] = mapped_column(JSONB)
    temporal_workflow_id: Mapped[str | None] = mapped_column(String(200))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
