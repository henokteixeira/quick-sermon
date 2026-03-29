from app.modules.youtube.models import YouTubeConnection
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)


class GetConnectionService:
    def __init__(self, connection_repo: YouTubeConnectionRepository):
        self.connection_repo = connection_repo

    async def execute(self) -> YouTubeConnection | None:
        return await self.connection_repo.get_active()
