import uuid

from sqlalchemy import ForeignKey, Integer, String
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
    status: Mapped[str] = mapped_column(String(20), default=VideoStatus.PENDING, nullable=False)
    youtube_video_id: Mapped[str | None] = mapped_column(String(50))

    submitted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
