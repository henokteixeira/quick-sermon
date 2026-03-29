import uuid

from temporalio.client import Client

from app.core.config import settings
from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import ClipAlreadyProcessingException, ClipNotFoundException
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.videos.exceptions import VideoNotFoundException
from app.modules.videos.repositories.video_repository import VideoRepository


class RetryClipService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        video_repo: VideoRepository,
        temporal_client: Client,
    ):
        self.clip_repo = clip_repo
        self.video_repo = video_repo
        self.temporal_client = temporal_client

    async def execute(self, clip_id: uuid.UUID) -> Clip:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if clip.status not in (ClipStatus.ERROR,):
            raise ClipAlreadyProcessingException()

        video = await self.video_repo.get_by_id(clip.video_id)
        if not video:
            raise VideoNotFoundException(str(clip.video_id))

        clip.status = ClipStatus.PENDING
        clip.error_code = None
        clip.error_message = None
        clip = await self.clip_repo.update(clip)

        await self.temporal_client.start_workflow(
            "DownloadAndTrimWorkflow",
            {
                "clip_id": str(clip.id),
                "source_url": video.source_url,
                "start_time": clip.start_time,
                "end_time": clip.end_time,
                "quality": clip.quality,
            },
            id=f"clip-{clip.id}-retry-{uuid.uuid4().hex[:8]}",
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )

        return clip
