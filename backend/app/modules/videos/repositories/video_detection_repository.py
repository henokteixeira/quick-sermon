import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.videos.models import VideoDetection


class VideoDetectionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, detection: VideoDetection) -> VideoDetection:
        self.session.add(detection)
        await self.session.flush()
        return detection

    async def get_by_id(self, detection_id: uuid.UUID) -> VideoDetection | None:
        result = await self.session.execute(
            select(VideoDetection).where(VideoDetection.id == detection_id)
        )
        return result.scalar_one_or_none()

    async def get_latest_by_video_id(self, video_id: uuid.UUID) -> VideoDetection | None:
        result = await self.session.execute(
            select(VideoDetection)
            .where(VideoDetection.video_id == video_id)
            .order_by(VideoDetection.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_latest_status_by_video_ids(
        self, video_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, str]:
        if not video_ids:
            return {}
        result = await self.session.execute(
            select(VideoDetection.video_id, VideoDetection.status)
            .where(VideoDetection.video_id.in_(video_ids))
            .order_by(
                VideoDetection.video_id, VideoDetection.created_at.desc()
            )
            .distinct(VideoDetection.video_id)
        )
        return {video_id: status for video_id, status in result.all()}

    async def update(self, detection: VideoDetection) -> VideoDetection:
        await self.session.flush()
        return detection
