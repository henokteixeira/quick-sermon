import uuid

from app.modules.videos.enums import VideoStatus
from app.modules.videos.exceptions import DuplicateVideoException, InvalidYouTubeUrlException
from app.modules.videos.models import Video
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.schemas import VideoCreate
from app.modules.videos.services.fetch_metadata_service import FetchMetadataService
from app.modules.videos.services.youtube_utils import extract_video_id, normalize_url


class SubmitVideoService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(self, data: VideoCreate, user_id: uuid.UUID) -> Video:
        video_id = extract_video_id(str(data.source_url))
        if not video_id:
            raise InvalidYouTubeUrlException()

        normalized_url = normalize_url(video_id)

        existing = await self.video_repo.get_by_url(normalized_url)
        if existing:
            raise DuplicateVideoException(normalized_url)

        metadata_service = FetchMetadataService()
        metadata = await metadata_service.execute(normalized_url)

        video = Video(
            source_url=normalized_url,
            title=metadata.title,
            duration=metadata.duration,
            thumbnail_url=metadata.thumbnail_url,
            youtube_video_id=metadata.video_id,
            status=VideoStatus.PENDING,
            submitted_by=user_id,
        )
        return await self.video_repo.create(video)
