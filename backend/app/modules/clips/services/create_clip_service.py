import uuid

from temporalio.client import Client

from app.core.config import settings
from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import InvalidTimestampsException
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import ClipCreate
from app.modules.videos.exceptions import VideoNotFoundException
from app.modules.videos.repositories.video_repository import VideoRepository


class CreateClipService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        video_repo: VideoRepository,
        temporal_client: Client,
    ):
        self.clip_repo = clip_repo
        self.video_repo = video_repo
        self.temporal_client = temporal_client

    async def execute(self, data: ClipCreate, user_id: uuid.UUID) -> Clip:
        video = await self.video_repo.get_by_id(data.video_id)
        if not video:
            raise VideoNotFoundException(str(data.video_id))

        if video.duration and data.end_time > video.duration:
            raise InvalidTimestampsException(
                f"end_time ({data.end_time}s) excede a duracao do video ({video.duration}s)."
            )

        clip = Clip(
            video_id=data.video_id,
            clip_type=data.clip_type,
            status=ClipStatus.PENDING,
            start_time=data.start_time,
            end_time=data.end_time,
            quality=data.quality,
            submitted_by=user_id,
        )
        clip = await self.clip_repo.create(clip)

        await self.temporal_client.start_workflow(
            "DownloadAndTrimWorkflow",
            {
                "clip_id": str(clip.id),
                "source_url": video.source_url,
                "start_time": data.start_time,
                "end_time": data.end_time,
                "quality": data.quality,
                "format_id": data.format_id,
            },
            id=f"clip-{clip.id}",
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )

        return clip
