import uuid

from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository


class GetClipService:
    def __init__(self, clip_repo: ClipRepository):
        self.clip_repo = clip_repo

    async def execute(self, clip_id: uuid.UUID) -> Clip:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))
        return clip
