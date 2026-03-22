import uuid

from app.modules.videos.exceptions import VideoNotFoundException
from app.modules.videos.models import Video
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.services.fetch_metadata_service import FetchMetadataService


class RefreshMetadataService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(self, video_id: uuid.UUID) -> Video:
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundException(str(video_id))

        metadata_service = FetchMetadataService()
        metadata = await metadata_service.execute(video.source_url)

        video.title = metadata.title
        video.duration = metadata.duration
        video.thumbnail_url = metadata.thumbnail_url
        video.channel_name = metadata.channel_name
        video.view_count = metadata.view_count
        video.upload_date = metadata.upload_date

        return await self.video_repo.update(video)
