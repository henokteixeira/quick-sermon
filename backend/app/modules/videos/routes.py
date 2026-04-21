import uuid

import structlog
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.schemas import PaginatedResponse
from app.core.temporal_client import get_temporal_client
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.videos.dependencies import (
    get_video_detection_repository,
    get_video_repository,
)
from app.modules.videos.enums import VideoStatus
from app.modules.videos.repositories.video_detection_repository import (
    VideoDetectionRepository,
)
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.schemas import (
    DetectionResponse,
    VideoCreate,
    VideoResponse,
    VideoUpdate,
)
from app.modules.videos.services.delete_video_service import DeleteVideoService
from app.modules.videos.services.fetch_formats_service import FetchFormatsService
from app.modules.videos.services.get_detection_service import GetDetectionService
from app.modules.videos.services.get_video_service import GetVideoService
from app.modules.videos.services.list_videos_service import ListVideosService
from app.modules.videos.services.refresh_metadata_service import RefreshMetadataService
from app.modules.videos.services.retry_detection_service import RetryDetectionService
from app.modules.videos.services.start_detection_service import StartDetectionService
from app.modules.videos.services.submit_video_service import SubmitVideoService
from app.modules.videos.services.update_video_service import UpdateVideoService

logger = structlog.get_logger()
router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.post("/", response_model=VideoResponse, status_code=201)
async def submit_video(
    data: VideoCreate,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
    detection_repo: VideoDetectionRepository = Depends(get_video_detection_repository),
    db: AsyncSession = Depends(get_db),
) -> VideoResponse:
    service = SubmitVideoService(video_repo)
    video = await service.execute(data, user.id)
    await db.commit()

    try:
        client = await get_temporal_client()
        starter = StartDetectionService(detection_repo, client)
        await starter.execute(video.id, video.source_url)
        await db.commit()
    except Exception as e:
        logger.warning(
            "detection_trigger_failed",
            video_id=str(video.id),
            error=str(e)[:200],
        )

    return VideoResponse.model_validate(video)


@router.get("/", response_model=PaginatedResponse[VideoResponse])
async def list_videos(
    status: VideoStatus | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
) -> PaginatedResponse[VideoResponse]:
    service = ListVideosService(video_repo)
    return await service.execute(status, page, page_size)


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: uuid.UUID,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
) -> VideoResponse:
    service = GetVideoService(video_repo)
    video = await service.execute(video_id)
    return VideoResponse.model_validate(video)


@router.patch("/{video_id}", response_model=VideoResponse)
async def update_video(
    video_id: uuid.UUID,
    data: VideoUpdate,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> VideoResponse:
    service = UpdateVideoService(video_repo)
    video = await service.execute(video_id, data)
    await db.commit()
    return VideoResponse.model_validate(video)


@router.post("/{video_id}/refresh", response_model=VideoResponse)
async def refresh_video(
    video_id: uuid.UUID,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> VideoResponse:
    service = RefreshMetadataService(video_repo)
    video = await service.execute(video_id)
    await db.commit()
    return VideoResponse.model_validate(video)


@router.delete("/{video_id}", status_code=204)
async def delete_video(
    video_id: uuid.UUID,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = DeleteVideoService(video_repo)
    await service.execute(video_id)
    await db.commit()


@router.get("/{video_id}/formats")
async def get_video_formats(
    video_id: uuid.UUID,
    clip_duration: int | None = Query(default=None, ge=1),
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
) -> dict:
    service = FetchFormatsService(video_repo)
    return await service.execute(video_id, clip_duration)


@router.get("/{video_id}/detection", response_model=DetectionResponse)
async def get_detection(
    video_id: uuid.UUID,
    user: User = Depends(get_current_user),
    detection_repo: VideoDetectionRepository = Depends(get_video_detection_repository),
) -> DetectionResponse:
    service = GetDetectionService(detection_repo)
    detection = await service.execute(video_id)
    return DetectionResponse.model_validate(detection)


@router.post("/{video_id}/detection/retry", response_model=DetectionResponse)
async def retry_detection(
    video_id: uuid.UUID,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
    detection_repo: VideoDetectionRepository = Depends(get_video_detection_repository),
    db: AsyncSession = Depends(get_db),
) -> DetectionResponse:
    client = await get_temporal_client()
    service = RetryDetectionService(video_repo, detection_repo, client)
    detection = await service.execute(video_id)
    await db.commit()
    return DetectionResponse.model_validate(detection)
