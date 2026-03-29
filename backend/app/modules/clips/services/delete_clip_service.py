import shutil
import uuid
from pathlib import Path

import structlog

from app.core.config import settings
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.repositories.clip_repository import ClipRepository

logger = structlog.get_logger()


class DeleteClipService:
    def __init__(self, clip_repo: ClipRepository):
        self.clip_repo = clip_repo

    async def execute(self, clip_id: uuid.UUID) -> None:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        clip_dir = Path(settings.CLIPS_BASE_DIR) / str(clip.id)
        if clip_dir.exists():
            shutil.rmtree(clip_dir)
            logger.info("clip_files_deleted", clip_id=str(clip_id))

        await self.clip_repo.delete(clip)
