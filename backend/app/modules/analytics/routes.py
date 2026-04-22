from fastapi import APIRouter, Depends

from app.modules.analytics.schemas import (
    AnalyticsSummaryResponse,
    ClipsStatsResponse,
    ClipStatsItem,
)
from app.modules.analytics.services.get_clips_stats_service import (
    GetClipsStatsService,
)
from app.modules.analytics.services.get_summary_service import GetSummaryService
from app.modules.auth.dependencies import get_current_user
from app.modules.clips.dependencies import get_clip_repository
from app.modules.clips.enums import ClipStatus
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.users.models import User
from app.modules.youtube.dependencies import (
    get_youtube_connection_repository,
    get_youtube_upload_repository,
)
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)
from app.modules.youtube.services.get_batch_video_stats_service import (
    GetBatchVideoStatsService,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/clips-stats", response_model=ClipsStatsResponse)
async def get_clips_stats(
    status: ClipStatus = ClipStatus.PUBLISHED,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
) -> ClipsStatsResponse:
    clips = await clip_repo.list_by_status(status)
    service = GetClipsStatsService(
        upload_repo=upload_repo,
        batch_stats_service=GetBatchVideoStatsService(connection_repo),
    )
    stats = await service.execute(clips)
    return ClipsStatsResponse(
        items=[
            ClipStatsItem(
                clip_id=clip.id,
                view_count=stats[clip.id].view_count,
                like_count=stats[clip.id].like_count,
                comment_count=stats[clip.id].comment_count,
            )
            for clip in clips
        ]
    )


@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_summary(
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
) -> AnalyticsSummaryResponse:
    clips_stats_service = GetClipsStatsService(
        upload_repo=upload_repo,
        batch_stats_service=GetBatchVideoStatsService(connection_repo),
    )
    service = GetSummaryService(clip_repo, clips_stats_service)
    return await service.execute()
