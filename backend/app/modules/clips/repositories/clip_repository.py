import uuid
from collections.abc import Sequence

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

    async def count_active_by_video_ids(
        self, video_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        if not video_ids:
            return {}
        result = await self.session.execute(
            select(Clip.video_id, func.count(Clip.id))
            .where(Clip.video_id.in_(video_ids))
            .where(Clip.status != ClipStatus.DISCARDED)
            .group_by(Clip.video_id)
        )
        return {video_id: count for video_id, count in result.all()}

    async def list_by_status(self, status: ClipStatus) -> list[Clip]:
        result = await self.session.execute(
            select(Clip).where(Clip.status == status).order_by(Clip.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_status_counts_by_video_ids(
        self, video_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, dict[str, int]]:
        if not video_ids:
            return {}
        result = await self.session.execute(
            select(Clip.video_id, Clip.status, func.count(Clip.id))
            .where(Clip.video_id.in_(video_ids))
            .group_by(Clip.video_id, Clip.status)
        )
        counts: dict[uuid.UUID, dict[str, int]] = {}
        for video_id, status, count in result.all():
            counts.setdefault(video_id, {})[status] = count
        return counts

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
