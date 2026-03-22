import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.schemas import PaginatedResponse
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.videos.dependencies import get_video_repository
from app.modules.videos.enums import VideoStatus
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.videos.schemas import VideoCreate, VideoResponse, VideoUpdate
from app.modules.videos.services.delete_video_service import DeleteVideoService
from app.modules.videos.services.get_video_service import GetVideoService
from app.modules.videos.services.refresh_metadata_service import RefreshMetadataService
from app.modules.videos.services.update_video_service import UpdateVideoService
from app.modules.videos.services.list_videos_service import ListVideosService
from app.modules.videos.services.submit_video_service import SubmitVideoService

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.post("/", response_model=VideoResponse, status_code=201)
async def submit_video(
    data: VideoCreate,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> VideoResponse:
    service = SubmitVideoService(video_repo)
    video = await service.execute(data, user.id)
    await db.commit()
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
