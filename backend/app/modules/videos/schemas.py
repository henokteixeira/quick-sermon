import uuid
from datetime import datetime

from pydantic import BaseModel, HttpUrl

from app.modules.videos.enums import VideoStatus


class VideoCreate(BaseModel):
    source_url: HttpUrl


class VideoMetadata(BaseModel):
    video_id: str
    title: str
    duration: int
    thumbnail_url: str
    channel_name: str | None = None
    view_count: int | None = None
    upload_date: str | None = None


class VideoUpdate(BaseModel):
    title: str | None = None


class VideoResponse(BaseModel):
    id: uuid.UUID
    source_url: str
    title: str | None
    duration: int | None
    thumbnail_url: str | None
    status: VideoStatus
    youtube_video_id: str | None
    channel_name: str | None
    view_count: int | None
    upload_date: str | None
    submitted_by: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
