import uuid

from app.core.schemas import PaginatedResponse
from app.modules.clips.enums import ClipStatus
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import ClipResponse


class ListClipsService:
    def __init__(self, clip_repo: ClipRepository):
        self.clip_repo = clip_repo

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
        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=[ClipResponse.model_validate(c) for c in clips],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
