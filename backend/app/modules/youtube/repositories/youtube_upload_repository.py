import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.youtube.models import YouTubeUpload


class YouTubeUploadRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, upload_id: uuid.UUID) -> YouTubeUpload | None:
        result = await self.session.execute(
            select(YouTubeUpload).where(YouTubeUpload.id == upload_id)
        )
        return result.scalar_one_or_none()

    async def get_by_clip_id(self, clip_id: uuid.UUID) -> YouTubeUpload | None:
        result = await self.session.execute(
            select(YouTubeUpload)
            .where(YouTubeUpload.clip_id == clip_id)
            .order_by(YouTubeUpload.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_by_clip_ids(
        self, clip_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, YouTubeUpload]:
        if not clip_ids:
            return {}
        result = await self.session.execute(
            select(YouTubeUpload)
            .where(YouTubeUpload.clip_id.in_(clip_ids))
            .order_by(YouTubeUpload.created_at.desc())
        )
        mapping: dict[uuid.UUID, YouTubeUpload] = {}
        for upload in result.scalars().all():
            if upload.clip_id not in mapping:
                mapping[upload.clip_id] = upload
        return mapping

    async def create(self, upload: YouTubeUpload) -> YouTubeUpload:
        self.session.add(upload)
        await self.session.flush()
        return upload

    async def update(self, upload: YouTubeUpload) -> YouTubeUpload:
        await self.session.flush()
        return upload
