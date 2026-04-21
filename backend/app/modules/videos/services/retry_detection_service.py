import uuid

from temporalio.client import Client

from app.modules.videos.enums import DetectionStatus
from app.modules.videos.exceptions import (
    DetectionNotFoundException,
    DetectionRetryNotAllowedException,
    VideoNotFoundException,
)
from app.modules.videos.models import VideoDetection
from app.modules.videos.repositories.video_detection_repository import (
    VideoDetectionRepository,
)
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.services.start_detection_service import StartDetectionService

RETRYABLE_STATUSES = {DetectionStatus.FAILED, DetectionStatus.SKIPPED}


class RetryDetectionService:
    def __init__(
        self,
        video_repo: VideoRepository,
        detection_repo: VideoDetectionRepository,
        temporal_client: Client,
    ):
        self.video_repo = video_repo
        self.detection_repo = detection_repo
        self.temporal_client = temporal_client

    async def execute(self, video_id: uuid.UUID) -> VideoDetection:
        video = await self.video_repo.get_by_id(video_id)
        if video is None:
            raise VideoNotFoundException(str(video_id))

        previous = await self.detection_repo.get_latest_by_video_id(video_id)
        if previous is None:
            raise DetectionNotFoundException(str(video_id))
        if previous.status not in RETRYABLE_STATUSES:
            raise DetectionRetryNotAllowedException(previous.status)

        starter = StartDetectionService(self.detection_repo, self.temporal_client)
        return await starter.execute(video_id, video.source_url)
