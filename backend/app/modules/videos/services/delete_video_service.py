import uuid

from app.modules.videos.exceptions import VideoNotFoundException
from app.modules.videos.repositories.video_repository import VideoRepository


class DeleteVideoService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(self, video_id: uuid.UUID) -> None:
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundException(str(video_id))
        await self.video_repo.delete(video)
