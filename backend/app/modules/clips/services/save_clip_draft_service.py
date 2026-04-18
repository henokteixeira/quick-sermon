import uuid

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipNotFoundException,
    ClipNotInReviewException,
)
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import ClipDraftUpdate


class SaveClipDraftService:
    def __init__(self, clip_repo: ClipRepository):
        self.clip_repo = clip_repo

    async def execute(self, clip_id: uuid.UUID, data: ClipDraftUpdate) -> Clip:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if clip.status != ClipStatus.AWAITING_REVIEW:
            raise ClipNotInReviewException(clip.status)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(clip, field, value)

        return await self.clip_repo.update(clip)
