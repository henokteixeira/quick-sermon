import uuid
from datetime import timedelta

import structlog
from temporalio.client import Client

from app.core.config import settings
from app.modules.videos.enums import DetectionStatus
from app.modules.videos.models import VideoDetection
from app.modules.videos.repositories.video_detection_repository import (
    VideoDetectionRepository,
)

logger = structlog.get_logger()


class StartDetectionService:
    def __init__(
        self,
        detection_repo: VideoDetectionRepository,
        temporal_client: Client,
    ):
        self.detection_repo = detection_repo
        self.temporal_client = temporal_client

    async def execute(self, video_id: uuid.UUID, source_url: str) -> VideoDetection:
        detection = VideoDetection(video_id=video_id, status=DetectionStatus.RUNNING)
        detection = await self.detection_repo.create(detection)
        workflow_id = f"detect-{detection.id}"
        detection.temporal_workflow_id = workflow_id
        await self.detection_repo.update(detection)

        try:
            await self.temporal_client.start_workflow(
                "DetectSermonTimestampsWorkflow",
                {
                    "video_id": str(video_id),
                    "source_url": source_url,
                    "detection_id": str(detection.id),
                },
                id=workflow_id,
                task_queue=settings.TEMPORAL_TASK_QUEUE,
                execution_timeout=timedelta(
                    minutes=settings.DETECTION_WORKFLOW_TIMEOUT_MINUTES
                ),
            )
        except Exception as e:
            logger.warning(
                "detection_workflow_start_failed",
                detection_id=str(detection.id),
                error=str(e)[:200],
            )
            detection.status = DetectionStatus.FAILED
            detection.error_message = f"workflow_start_failed: {str(e)[:300]}"
            await self.detection_repo.update(detection)

        return detection
