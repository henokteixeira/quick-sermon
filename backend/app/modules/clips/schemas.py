import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.modules.clips.enums import ClipErrorCode, ClipStatus, ClipType

TITLE_MAX_LEN = 100
DESCRIPTION_MAX_LEN = 5000
WHATSAPP_MAX_LEN = 4000


class ClipCreate(BaseModel):
    video_id: uuid.UUID
    start_time: int
    end_time: int
    quality: str
    clip_type: ClipType = ClipType.SERMON
    format_id: str | None = None

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: int, info) -> int:
        if "start_time" in info.data and v <= info.data["start_time"]:
            raise ValueError("end_time must be greater than start_time")
        return v

    @field_validator("start_time")
    @classmethod
    def start_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("start_time must be non-negative")
        return v


class ClipResponse(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    clip_type: ClipType
    status: ClipStatus
    start_time: int
    end_time: int
    quality: str
    file_path: str | None
    file_size: int | None
    duration: int | None
    resolution: str | None
    error_code: ClipErrorCode | None
    error_message: str | None
    submitted_by: uuid.UUID | None
    selected_title: str | None
    published_at: datetime | None
    discarded_at: datetime | None
    downloaded_at: datetime | None
    trimmed_at: datetime | None
    uploaded_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClipReviewResponse(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    status: ClipStatus
    start_time: int
    end_time: int
    duration: int | None
    file_path: str | None
    generated_titles: list[str] | None
    generated_description: str | None
    generated_whatsapp_message: str | None
    selected_title: str | None
    description: str | None
    whatsapp_message: str | None
    published_at: datetime | None
    discarded_at: datetime | None
    youtube_video_id: str | None
    youtube_url: str | None
    can_publish: bool
    can_discard: bool

    model_config = {"from_attributes": True}


class ClipDraftUpdate(BaseModel):
    selected_title: str | None = Field(default=None, max_length=TITLE_MAX_LEN)
    description: str | None = Field(default=None, max_length=DESCRIPTION_MAX_LEN)
    whatsapp_message: str | None = Field(default=None, max_length=WHATSAPP_MAX_LEN)


class ClipPublishResponse(BaseModel):
    id: uuid.UUID
    status: ClipStatus
    published_at: datetime | None
    youtube_url: str | None

    model_config = {"from_attributes": True}


class VideoFormat(BaseModel):
    resolution: str
    height: int
    estimated_size_mb: float
    format_id: str | None = None


class VideoFormatsResponse(BaseModel):
    video_id: uuid.UUID
    duration: int | None
    formats: list[VideoFormat]


class ClipPipelineStageResponse(BaseModel):
    status: str
    percent: float | None
    speed: str | None
    completed_at: datetime | None
    error_code: str | None
    error_message: str | None

    model_config = {"from_attributes": True}


class ClipPipelineResponse(BaseModel):
    download: ClipPipelineStageResponse
    trim: ClipPipelineStageResponse
    upload: ClipPipelineStageResponse


class ClipYouTubeStatsResponse(BaseModel):
    view_count: int | None
    like_count: int | None
    comment_count: int | None
