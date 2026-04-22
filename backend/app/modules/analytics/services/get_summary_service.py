from app.modules.analytics.schemas import AnalyticsSummaryResponse
from app.modules.analytics.services.get_clips_stats_service import (
    GetClipsStatsService,
)
from app.modules.clips.enums import ClipStatus
from app.modules.clips.repositories.clip_repository import ClipRepository


class GetSummaryService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        clips_stats_service: GetClipsStatsService,
    ):
        self.clip_repo = clip_repo
        self.clips_stats_service = clips_stats_service

    async def execute(self) -> AnalyticsSummaryResponse:
        published = await self.clip_repo.list_by_status(ClipStatus.PUBLISHED)
        stats = await self.clips_stats_service.execute(published)

        total_views = 0
        total_likes = 0
        total_comments = 0
        has_view = False
        has_like = False
        has_comment = False
        for clip in published:
            s = stats.get(clip.id)
            if s is None:
                continue
            if s.view_count is not None:
                total_views += s.view_count
                has_view = True
            if s.like_count is not None:
                total_likes += s.like_count
                has_like = True
            if s.comment_count is not None:
                total_comments += s.comment_count
                has_comment = True

        processed_duration = sum(
            (clip.duration if clip.duration is not None else clip.end_time - clip.start_time)
            for clip in published
        )

        return AnalyticsSummaryResponse(
            total_views=total_views if has_view else None,
            total_likes=total_likes if has_like else None,
            total_comments=total_comments if has_comment else None,
            published_clips=len(published),
            processed_duration_seconds=processed_duration,
        )
