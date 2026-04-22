import uuid

from pydantic import BaseModel


class ClipStatsItem(BaseModel):
    clip_id: uuid.UUID
    view_count: int | None
    like_count: int | None
    comment_count: int | None


class ClipsStatsResponse(BaseModel):
    items: list[ClipStatsItem]


class AnalyticsSummaryResponse(BaseModel):
    total_views: int | None
    total_likes: int | None
    total_comments: int | None
    published_clips: int
    processed_duration_seconds: int
