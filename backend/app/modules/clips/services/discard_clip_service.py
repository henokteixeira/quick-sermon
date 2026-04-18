import asyncio
import uuid
from datetime import datetime, timezone

import structlog

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipNotFoundException,
    ClipNotInReviewException,
)
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.youtube.activities import delete_youtube_video
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)

logger = structlog.get_logger()


class DiscardClipService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        upload_repo: YouTubeUploadRepository,
    ):
        self.clip_repo = clip_repo
        self.upload_repo = upload_repo

    async def execute(self, clip_id: uuid.UUID) -> Clip:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if clip.status != ClipStatus.AWAITING_REVIEW:
            raise ClipNotInReviewException(clip.status)

        upload = await self.upload_repo.get_by_clip_id(clip_id)
        if upload and upload.youtube_video_id:
            try:
                await asyncio.to_thread(delete_youtube_video, upload.youtube_video_id)
            except Exception as exc:
                # Don't block the discard — log and continue. The clip is still
                # marked discarded locally; orphan video on YouTube can be cleaned
                # up manually. Aligns with "errors never block user flow" rule.
                logger.warning(
                    "youtube_delete_failed",
                    clip_id=str(clip_id),
                    video_id=upload.youtube_video_id,
                    error=str(exc)[:200],
                )

        clip.status = ClipStatus.DISCARDED
        clip.discarded_at = datetime.now(timezone.utc)
        await self.clip_repo.update(clip)

        logger.info("clip_discarded", clip_id=str(clip_id))
        return clip
