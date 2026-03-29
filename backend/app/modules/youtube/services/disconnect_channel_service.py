from app.modules.youtube.exceptions import YouTubeConnectionNotFoundException
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)


class DisconnectChannelService:
    def __init__(self, connection_repo: YouTubeConnectionRepository):
        self.connection_repo = connection_repo

    async def execute(self) -> None:
        connection = await self.connection_repo.get_active()
        if not connection:
            raise YouTubeConnectionNotFoundException()
        await self.connection_repo.delete(connection)
