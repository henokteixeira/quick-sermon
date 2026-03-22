import uuid

from app.modules.videos.exceptions import VideoNotFoundException
from app.modules.videos.models import Video
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.schemas import VideoUpdate


class UpdateVideoService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(self, video_id: uuid.UUID, data: VideoUpdate) -> Video:
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundException(str(video_id))

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(video, field, value)

        return await self.video_repo.update(video)
