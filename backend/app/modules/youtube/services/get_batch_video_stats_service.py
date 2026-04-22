import time
from collections.abc import Sequence

import structlog
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.core.config import settings
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.services.get_video_stats_service import (
    CACHE_TTL_SECONDS,
    VideoStats,
    _cache,
    _to_int,
)
from app.modules.youtube.services.token_encryption_service import decrypt_token

logger = structlog.get_logger()

YOUTUBE_BATCH_SIZE = 50


class GetBatchVideoStatsService:
    def __init__(self, connection_repo: YouTubeConnectionRepository):
        self.connection_repo = connection_repo

    async def execute(
        self, youtube_video_ids: Sequence[str]
    ) -> dict[str, VideoStats]:
        if not youtube_video_ids:
            return {}

        unique_ids = list(dict.fromkeys(youtube_video_ids))
        results: dict[str, VideoStats] = {}
        missing: list[str] = []
        now = time.time()
        for video_id in unique_ids:
            cached = _cache.get(video_id)
            if cached and cached[0] > now:
                results[video_id] = cached[1]
            else:
                missing.append(video_id)

        if not missing:
            return results

        connection = await self.connection_repo.get_active()
        if not connection:
            for video_id in missing:
                results[video_id] = VideoStats(
                    view_count=None, like_count=None, comment_count=None
                )
            return results

        try:
            access_token = decrypt_token(connection.access_token)
            refresh_token = decrypt_token(connection.refresh_token)
        except Exception as exc:
            logger.warning("youtube_stats_token_decrypt_failed", error=str(exc)[:200])
            for video_id in missing:
                results[video_id] = VideoStats(
                    view_count=None, like_count=None, comment_count=None
                )
            return results

        for start in range(0, len(missing), YOUTUBE_BATCH_SIZE):
            chunk = missing[start : start + YOUTUBE_BATCH_SIZE]
            try:
                fetched = _fetch_batch(chunk, access_token, refresh_token)
            except Exception as exc:
                logger.warning(
                    "youtube_batch_stats_fetch_failed",
                    count=len(chunk),
                    error=str(exc)[:200],
                )
                for video_id in chunk:
                    results[video_id] = VideoStats(
                        view_count=None, like_count=None, comment_count=None
                    )
                continue

            expires_at = time.time() + CACHE_TTL_SECONDS
            for video_id in chunk:
                stats = fetched.get(
                    video_id,
                    VideoStats(view_count=None, like_count=None, comment_count=None),
                )
                results[video_id] = stats
                _cache[video_id] = (expires_at, stats)

        return results


def _fetch_batch(
    video_ids: Sequence[str], access_token: str, refresh_token: str
) -> dict[str, VideoStats]:
    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.YOUTUBE_CLIENT_ID,
        client_secret=settings.YOUTUBE_CLIENT_SECRET,
    )
    youtube = build("youtube", "v3", credentials=credentials)
    response = (
        youtube.videos().list(part="statistics", id=",".join(video_ids)).execute()
    )
    mapping: dict[str, VideoStats] = {}
    for item in response.get("items", []):
        video_id = item.get("id")
        if not video_id:
            continue
        stats = item.get("statistics", {})
        mapping[video_id] = VideoStats(
            view_count=_to_int(stats.get("viewCount")),
            like_count=_to_int(stats.get("likeCount")),
            comment_count=_to_int(stats.get("commentCount")),
        )
    return mapping
