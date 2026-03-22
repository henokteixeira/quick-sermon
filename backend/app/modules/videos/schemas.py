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


class VideoResponse(BaseModel):
    id: uuid.UUID
    source_url: str
    title: str | None
    duration: int | None
    thumbnail_url: str | None
    status: VideoStatus
    youtube_video_id: str | None
    submitted_by: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
