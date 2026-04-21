import uuid

from app.modules.videos.exceptions import DetectionNotFoundException
from app.modules.videos.models import VideoDetection
from app.modules.videos.repositories.video_detection_repository import (
    VideoDetectionRepository,
)


class GetDetectionService:
    def __init__(self, detection_repo: VideoDetectionRepository):
        self.detection_repo = detection_repo

    async def execute(self, video_id: uuid.UUID) -> VideoDetection:
        detection = await self.detection_repo.get_latest_by_video_id(video_id)
        if detection is None:
            raise DetectionNotFoundException(str(video_id))
        return detection
