from app.core.schemas import PaginatedResponse
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.videos.enums import VideoStatus
from app.modules.videos.repositories.video_detection_repository import (
    VideoDetectionRepository,
)
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.schemas import VideoResponse
from app.modules.videos.services.build_video_responses import build_video_responses


class ListVideosService:
    def __init__(
        self,
        video_repo: VideoRepository,
        clip_repo: ClipRepository,
        detection_repo: VideoDetectionRepository,
    ):
        self.video_repo = video_repo
        self.clip_repo = clip_repo
        self.detection_repo = detection_repo

    async def execute(
        self,
        status: VideoStatus | None,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[VideoResponse]:
        offset = (page - 1) * page_size
        videos, total = await self.video_repo.list_all(
            status=status, offset=offset, limit=page_size
        )
        items = await build_video_responses(videos, self.clip_repo, self.detection_repo)
        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
