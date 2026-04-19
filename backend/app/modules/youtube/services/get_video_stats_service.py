import time
import uuid
from dataclasses import dataclass

import structlog
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.core.config import settings
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)
from app.modules.youtube.services.token_encryption_service import decrypt_token

logger = structlog.get_logger()

CACHE_TTL_SECONDS = 300

_cache: dict[str, tuple[float, "VideoStats"]] = {}


@dataclass
class VideoStats:
    view_count: int | None
    like_count: int | None
    comment_count: int | None


def _empty() -> VideoStats:
    return VideoStats(view_count=None, like_count=None, comment_count=None)


class GetVideoStatsService:
    def __init__(
        self,
        connection_repo: YouTubeConnectionRepository,
        upload_repo: YouTubeUploadRepository,
    ):
        self.connection_repo = connection_repo
        self.upload_repo = upload_repo

    async def execute(self, clip_id: uuid.UUID) -> VideoStats:
        upload = await self.upload_repo.get_by_clip_id(clip_id)
        if not upload or not upload.youtube_video_id:
            return _empty()

        video_id = upload.youtube_video_id
        cached = _cache.get(video_id)
        now = time.time()
        if cached and cached[0] > now:
            return cached[1]

        connection = await self.connection_repo.get_active()
        if not connection:
            return _empty()

        try:
            stats = _fetch_stats(
                video_id=video_id,
                access_token=decrypt_token(connection.access_token),
                refresh_token=decrypt_token(connection.refresh_token),
            )
        except Exception as exc:
            logger.warning(
                "youtube_stats_fetch_failed",
                video_id=video_id,
                error=str(exc)[:200],
            )
            return _empty()

        _cache[video_id] = (now + CACHE_TTL_SECONDS, stats)
        return stats


def _fetch_stats(video_id: str, access_token: str, refresh_token: str) -> VideoStats:
    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.YOUTUBE_CLIENT_ID,
        client_secret=settings.YOUTUBE_CLIENT_SECRET,
    )
    youtube = build("youtube", "v3", credentials=credentials)
    response = (
        youtube.videos().list(part="statistics", id=video_id).execute()
    )
    items = response.get("items", [])
    if not items:
        return _empty()

    stats = items[0].get("statistics", {})
    return VideoStats(
        view_count=_to_int(stats.get("viewCount")),
        like_count=_to_int(stats.get("likeCount")),
        comment_count=_to_int(stats.get("commentCount")),
    )


def _to_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
