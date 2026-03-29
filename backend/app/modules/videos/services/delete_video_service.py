import shutil
import uuid
from pathlib import Path

import structlog
from sqlalchemy import select

from app.core.config import settings
from app.modules.clips.models import Clip
from app.modules.videos.exceptions import VideoNotFoundException
from app.modules.videos.repositories.video_repository import VideoRepository

logger = structlog.get_logger()


class DeleteVideoService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(self, video_id: uuid.UUID) -> None:
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundException(str(video_id))

        # Clean up clip files before CASCADE deletes the rows
        clips_dir = Path(settings.CLIPS_BASE_DIR)
        if clips_dir.exists():
            session = self.video_repo.session
            result = await session.execute(
                select(Clip.id).where(Clip.video_id == video_id)
            )
            for (clip_id,) in result.all():
                clip_dir = clips_dir / str(clip_id)
                if clip_dir.exists():
                    shutil.rmtree(clip_dir)
                    logger.info("clip_files_deleted", clip_id=str(clip_id))

        await self.video_repo.delete(video)
