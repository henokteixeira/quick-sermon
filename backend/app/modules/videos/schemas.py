import uuid
from datetime import datetime

from pydantic import BaseModel, HttpUrl

from app.modules.videos.enums import VideoStatus


class VideoCreate(BaseModel):
    source_url: HttpUrl


class VideoResponse(BaseModel):
    id: uuid.UUID
    source_url: str
    title: str | None
    duration: int | None
    thumbnail_url: str | None
    status: VideoStatus
    youtube_video_id: str | None
    sermon_start: int | None
    sermon_end: int | None
    confidence: float | None
    selected_title: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TimestampUpdate(BaseModel):
    sermon_start: int
    sermon_end: int
