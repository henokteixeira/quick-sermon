import uuid
from datetime import datetime, timezone

from temporalio.client import Client

from app.core.config import settings
from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.youtube.exceptions import (
    ClipNotReadyException,
    QuotaExceededException,
    YouTubeConnectionNotFoundException,
)
from app.modules.youtube.models import YouTubeUpload
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)
from app.modules.youtube.services.get_quota_service import DAILY_LIMIT, UPLOAD_COST


class TriggerUploadService:
    def __init__(
        self,
        connection_repo: YouTubeConnectionRepository,
        upload_repo: YouTubeUploadRepository,
        clip_repo: ClipRepository,
        video_repo: VideoRepository,
        temporal_client: Client,
    ):
        self.connection_repo = connection_repo
        self.upload_repo = upload_repo
        self.clip_repo = clip_repo
        self.video_repo = video_repo
        self.temporal_client = temporal_client

    async def execute(
        self,
        clip_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> YouTubeUpload:
        connection = await self.connection_repo.get_active()
        if not connection:
            raise YouTubeConnectionNotFoundException()

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if connection.quota_reset_date != today:
            connection.daily_quota_used = 0
            connection.quota_reset_date = today

        if connection.daily_quota_used + UPLOAD_COST > DAILY_LIMIT:
            raise QuotaExceededException()

        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if clip.status != ClipStatus.READY:
            raise ClipNotReadyException()

        video = await self.video_repo.get_by_id(clip.video_id)
        if not video:
            raise ClipNotFoundException(str(clip_id))

        upload_title = clip.selected_title or f"{video.title or 'Clip'} — Clip"
        upload_description = (
            clip.description or f"Clip extraido de {video.title or video.source_url}"
        )

        upload = YouTubeUpload(
            clip_id=clip_id,
            title=upload_title[:100],
            description=upload_description,
            uploaded_by=user_id,
        )
        upload = await self.upload_repo.create(upload)

        workflow_id = f"youtube-upload-{upload.id}"
        clip.status = ClipStatus.UPLOADING
        clip.temporal_workflow_id = workflow_id
        clip.uploaded_at = None
        await self.clip_repo.update(clip)

        await self.temporal_client.start_workflow(
            "UploadToYouTubeWorkflow",
            {
                "upload_id": str(upload.id),
                "clip_id": str(clip_id),
                "file_path": clip.file_path,
                "title": upload_title,
                "description": upload_description,
            },
            id=workflow_id,
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )

        return upload
