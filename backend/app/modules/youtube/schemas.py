import uuid
from datetime import datetime

from pydantic import BaseModel

from app.modules.youtube.enums import YouTubeUploadErrorCode, YouTubeUploadStatus


class YouTubeConnectionResponse(BaseModel):
    id: uuid.UUID
    channel_id: str
    channel_title: str
    connected_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class OAuthAuthorizeResponse(BaseModel):
    authorize_url: str


class UploadRequest(BaseModel):
    clip_id: uuid.UUID


class YouTubeUploadResponse(BaseModel):
    id: uuid.UUID
    clip_id: uuid.UUID
    youtube_video_id: str | None
    youtube_url: str | None
    youtube_status: YouTubeUploadStatus
    title: str
    description: str | None
    error_code: YouTubeUploadErrorCode | None
    error_message: str | None
    uploaded_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class QuotaResponse(BaseModel):
    daily_limit: int = 10000
    used: int
    remaining: int
    percent_used: float
    warning: bool
    blocked: bool
