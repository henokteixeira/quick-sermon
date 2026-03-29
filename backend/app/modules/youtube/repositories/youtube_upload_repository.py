import uuid

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

    async def create(self, upload: YouTubeUpload) -> YouTubeUpload:
        self.session.add(upload)
        await self.session.flush()
        return upload

    async def update(self, upload: YouTubeUpload) -> YouTubeUpload:
        await self.session.flush()
        return upload
