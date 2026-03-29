import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from app.modules.clips.enums import ClipErrorCode, ClipStatus, ClipType


class ClipCreate(BaseModel):
    video_id: uuid.UUID
    start_time: int
    end_time: int
    quality: str
    clip_type: ClipType = ClipType.SERMON

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
    created_at: datetime

    model_config = {"from_attributes": True}


class VideoFormat(BaseModel):
    resolution: str
    height: int
    estimated_size_mb: float


class VideoFormatsResponse(BaseModel):
    video_id: uuid.UUID
    duration: int | None
    formats: list[VideoFormat]
