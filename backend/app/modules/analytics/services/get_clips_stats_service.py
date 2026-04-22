import uuid
from collections.abc import Sequence

from app.modules.clips.models import Clip
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)
from app.modules.youtube.services.get_batch_video_stats_service import (
    GetBatchVideoStatsService,
)
from app.modules.youtube.services.get_video_stats_service import VideoStats


class GetClipsStatsService:
    def __init__(
        self,
        upload_repo: YouTubeUploadRepository,
        batch_stats_service: GetBatchVideoStatsService,
    ):
        self.upload_repo = upload_repo
        self.batch_stats_service = batch_stats_service

    async def execute(
        self, clips: Sequence[Clip]
    ) -> dict[uuid.UUID, VideoStats]:
        clip_ids = [c.id for c in clips]
        if not clip_ids:
            return {}

        uploads = await self.upload_repo.list_by_clip_ids(clip_ids)

        clip_to_youtube_id: dict[uuid.UUID, str] = {}
        for clip_id, upload in uploads.items():
            if upload.youtube_video_id:
                clip_to_youtube_id[clip_id] = upload.youtube_video_id

        stats_by_youtube = await self.batch_stats_service.execute(
            list(clip_to_youtube_id.values())
        )

        result: dict[uuid.UUID, VideoStats] = {}
        for clip_id in clip_ids:
            youtube_id = clip_to_youtube_id.get(clip_id)
            if youtube_id and youtube_id in stats_by_youtube:
                result[clip_id] = stats_by_youtube[youtube_id]
            else:
                result[clip_id] = VideoStats(
                    view_count=None, like_count=None, comment_count=None
                )
        return result
