import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, TimestampMixin, UUIDMixin
from app.modules.youtube.enums import YouTubeUploadStatus


class YouTubeConnection(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "youtube_connections"

    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_expiry: Mapped[str | None] = mapped_column(DateTime(timezone=True))
    channel_id: Mapped[str] = mapped_column(String(100), nullable=False)
    channel_title: Mapped[str] = mapped_column(String(255), nullable=False)
    daily_quota_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quota_reset_date: Mapped[str | None] = mapped_column(String(10))
    connected_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )


class YouTubeUpload(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "youtube_uploads"

    clip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clips.id", ondelete="CASCADE"), nullable=False
    )
    youtube_video_id: Mapped[str | None] = mapped_column(String(50))
    youtube_url: Mapped[str | None] = mapped_column(String(500))
    youtube_status: Mapped[str] = mapped_column(
        String(20), default=YouTubeUploadStatus.UPLOADING, nullable=False
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    error_code: Mapped[str | None] = mapped_column(String(50))
    error_message: Mapped[str | None] = mapped_column(Text)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
