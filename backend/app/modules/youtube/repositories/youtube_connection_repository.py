from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.youtube.models import YouTubeConnection


class YouTubeConnectionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_active(self) -> YouTubeConnection | None:
        result = await self.session.execute(
            select(YouTubeConnection).order_by(YouTubeConnection.created_at.desc()).limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, connection: YouTubeConnection) -> YouTubeConnection:
        self.session.add(connection)
        await self.session.flush()
        return connection

    async def update(self, connection: YouTubeConnection) -> YouTubeConnection:
        await self.session.flush()
        return connection

    async def delete(self, connection: YouTubeConnection) -> None:
        await self.session.delete(connection)
        await self.session.flush()

    async def delete_all(self) -> None:
        result = await self.session.execute(select(YouTubeConnection))
        for conn in result.scalars().all():
            await self.session.delete(conn)
        await self.session.flush()
