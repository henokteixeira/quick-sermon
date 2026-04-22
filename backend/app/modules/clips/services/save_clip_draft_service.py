import asyncio
import uuid

import structlog
from googleapiclient.errors import HttpError

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipAlreadyDiscardedException,
    ClipAlreadyPublishedException,
    ClipNotFoundException,
)
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import ClipDraftUpdate
from app.modules.youtube.activities import update_youtube_video_snippet
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)

logger = structlog.get_logger()


class SaveClipDraftService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        upload_repo: YouTubeUploadRepository,
    ):
        self.clip_repo = clip_repo
        self.upload_repo = upload_repo

    async def execute(self, clip_id: uuid.UUID, data: ClipDraftUpdate) -> Clip:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if clip.status == ClipStatus.PUBLISHED:
            raise ClipAlreadyPublishedException()
        if clip.status == ClipStatus.DISCARDED:
            raise ClipAlreadyDiscardedException()

        update_data = data.model_dump(exclude_unset=True)

        previous_title = clip.selected_title
        previous_description = clip.description

        for field, value in update_data.items():
            setattr(clip, field, value)

        clip = await self.clip_repo.update(clip)

        title_changed = (
            "selected_title" in update_data
            and clip.selected_title != previous_title
        )
        description_changed = (
            "description" in update_data
            and clip.description != previous_description
        )

        if title_changed or description_changed:
            await self._sync_to_youtube(clip)

        return clip

    async def _sync_to_youtube(self, clip: Clip) -> None:
        upload = await self.upload_repo.get_by_clip_id(clip.id)
        if not upload or not upload.youtube_video_id:
            return

        title = (clip.selected_title or "").strip()
        description = (clip.description or "").strip()
        if not title or not description:
            return

        try:
            await asyncio.to_thread(
                update_youtube_video_snippet,
                upload.youtube_video_id,
                title,
                description,
            )
            logger.info(
                "youtube_snippet_synced",
                clip_id=str(clip.id),
                video_id=upload.youtube_video_id,
            )
        except HttpError as exc:
            logger.warning(
                "youtube_snippet_sync_failed",
                clip_id=str(clip.id),
                video_id=upload.youtube_video_id,
                status=getattr(exc.resp, "status", None),
            )
        except Exception as exc:
            logger.warning(
                "youtube_snippet_sync_error",
                clip_id=str(clip.id),
                error=str(exc)[:200],
            )
