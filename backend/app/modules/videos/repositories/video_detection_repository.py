import uuid

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

    async def update(self, detection: VideoDetection) -> VideoDetection:
        await self.session.flush()
        return detection
