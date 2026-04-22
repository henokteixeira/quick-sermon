import uuid

from app.core.schemas import PaginatedResponse
from app.modules.clips.enums import ClipStatus
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import ClipResponse
from app.modules.videos.repositories.video_repository import VideoRepository


class ListClipsService:
    def __init__(self, clip_repo: ClipRepository, video_repo: VideoRepository):
        self.clip_repo = clip_repo
        self.video_repo = video_repo

    async def execute(
        self,
        video_id: uuid.UUID | None,
        status: ClipStatus | None,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[ClipResponse]:
        offset = (page - 1) * page_size
        clips, total = await self.clip_repo.list_all(
            video_id=video_id, status=status, offset=offset, limit=page_size
        )
        thumbnails = await self.video_repo.get_thumbnails_by_ids(
            list({c.video_id for c in clips})
        )
        items = []
        for clip in clips:
            response = ClipResponse.model_validate(clip)
            response.video_thumbnail_url = thumbnails.get(clip.video_id)
            items.append(response)
        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
