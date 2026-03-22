from app.core.schemas import PaginatedResponse
from app.modules.videos.enums import VideoStatus
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.schemas import VideoResponse


class ListVideosService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

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
        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=[VideoResponse.model_validate(v) for v in videos],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
