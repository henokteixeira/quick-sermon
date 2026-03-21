import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.videos.enums import VideoStatus
from app.modules.videos.models import Video


class VideoRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, video_id: uuid.UUID) -> Video | None:
        result = await self.session.execute(select(Video).where(Video.id == video_id))
        return result.scalar_one_or_none()

    async def get_by_url(self, url: str) -> Video | None:
        result = await self.session.execute(select(Video).where(Video.source_url == url))
        return result.scalar_one_or_none()

    async def create(self, video: Video) -> Video:
        self.session.add(video)
        await self.session.flush()
        return video

    async def list_all(
        self,
        status: VideoStatus | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Video], int]:
        query = select(Video)
        count_query = select(func.count()).select_from(Video)

        if status:
            query = query.where(Video.status == status)
            count_query = count_query.where(Video.status == status)

        total = (await self.session.execute(count_query)).scalar() or 0
        result = await self.session.execute(
            query.offset(offset).limit(limit).order_by(Video.created_at.desc())
        )
        return list(result.scalars().all()), total
