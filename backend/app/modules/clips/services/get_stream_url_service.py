import uuid

from app.core.exceptions import ValidationException
from app.core.security import create_stream_token
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.repositories.clip_repository import ClipRepository


class GetStreamUrlService:
    def __init__(self, clip_repo: ClipRepository):
        self.clip_repo = clip_repo

    async def execute(self, clip_id: uuid.UUID) -> dict:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if not clip.file_path:
            raise ValidationException("Clip file not available yet.")

        token = create_stream_token(str(clip_id))
        return {"url": f"/api/clips/{clip_id}/stream?token={token}"}
