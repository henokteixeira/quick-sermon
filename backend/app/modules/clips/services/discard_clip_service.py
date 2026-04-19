import asyncio
import uuid
from datetime import datetime, timezone

import structlog
from temporalio.client import Client
from temporalio.service import RPCError

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipAlreadyDiscardedException,
    ClipAlreadyPublishedException,
    ClipNotFoundException,
)
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.youtube.activities import delete_youtube_video
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)

logger = structlog.get_logger()

ACTIVE_PIPELINE_STATUSES = {
    ClipStatus.PENDING,
    ClipStatus.DOWNLOADING,
    ClipStatus.TRIMMING,
    ClipStatus.UPLOADING,
}


class DiscardClipService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        upload_repo: YouTubeUploadRepository,
        temporal_client: Client,
    ):
        self.clip_repo = clip_repo
        self.upload_repo = upload_repo
        self.temporal_client = temporal_client

    async def execute(self, clip_id: uuid.UUID) -> Clip:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if clip.status == ClipStatus.PUBLISHED:
            raise ClipAlreadyPublishedException()

        if clip.status == ClipStatus.DISCARDED:
            raise ClipAlreadyDiscardedException()

        # Cancel Temporal workflow if pipeline is currently active.
        if clip.status in ACTIVE_PIPELINE_STATUSES and clip.temporal_workflow_id:
            try:
                handle = self.temporal_client.get_workflow_handle(
                    clip.temporal_workflow_id
                )
                await handle.cancel()
                logger.info(
                    "temporal_workflow_cancelled",
                    clip_id=str(clip_id),
                    workflow_id=clip.temporal_workflow_id,
                )
            except RPCError as exc:
                # Workflow may have already completed or been terminated — that's fine.
                logger.warning(
                    "temporal_cancel_failed",
                    clip_id=str(clip_id),
                    workflow_id=clip.temporal_workflow_id,
                    error=str(exc)[:200],
                )

        # Delete video from YouTube if it was already uploaded there.
        upload = await self.upload_repo.get_by_clip_id(clip_id)
        if upload and upload.youtube_video_id:
            try:
                await asyncio.to_thread(delete_youtube_video, upload.youtube_video_id)
            except Exception as exc:
                # Don't block the discard — log and continue. The clip is still
                # marked discarded locally; orphan video on YouTube can be cleaned
                # up manually.
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
