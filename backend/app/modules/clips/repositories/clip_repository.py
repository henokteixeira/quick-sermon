import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.clips.enums import ClipStatus
from app.modules.clips.models import Clip


class ClipRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, clip_id: uuid.UUID) -> Clip | None:
        result = await self.session.execute(select(Clip).where(Clip.id == clip_id))
        return result.scalar_one_or_none()

    async def create(self, clip: Clip) -> Clip:
        self.session.add(clip)
        await self.session.flush()
        return clip

    async def update(self, clip: Clip) -> Clip:
        await self.session.flush()
        return clip

    async def delete(self, clip: Clip) -> None:
        await self.session.delete(clip)
        await self.session.flush()

    async def list_all(
        self,
        video_id: uuid.UUID | None = None,
        status: ClipStatus | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Clip], int]:
        query = select(Clip)
        count_query = select(func.count()).select_from(Clip)

        if video_id:
            query = query.where(Clip.video_id == video_id)
            count_query = count_query.where(Clip.video_id == video_id)

        if status:
            query = query.where(Clip.status == status)
            count_query = count_query.where(Clip.status == status)

        total = (await self.session.execute(count_query)).scalar() or 0
        result = await self.session.execute(
            query.offset(offset).limit(limit).order_by(Clip.created_at.desc())
        )
        return list(result.scalars().all()), total
