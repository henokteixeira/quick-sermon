import uuid

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.schemas import PaginatedResponse
from app.core.temporal_client import get_temporal_client
from app.modules.auth.dependencies import get_current_user
from app.modules.clips.dependencies import get_clip_repository
from app.modules.clips.enums import ClipStatus
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import ClipCreate, ClipResponse
from app.modules.clips.services.create_clip_service import CreateClipService
from app.modules.clips.services.delete_clip_service import DeleteClipService
from app.modules.clips.services.get_clip_progress_service import GetClipProgressService
from app.modules.clips.services.get_clip_service import GetClipService
from app.modules.clips.services.get_stream_url_service import GetStreamUrlService
from app.modules.clips.services.list_clips_service import ListClipsService
from app.modules.clips.services.retry_clip_service import RetryClipService
from app.modules.clips.services.stream_clip_service import StreamClipService
from app.modules.users.models import User
from app.modules.videos.dependencies import get_video_repository
from app.modules.videos.repositories.video_repository import VideoRepository

router = APIRouter(prefix="/api/clips", tags=["clips"])


@router.post("/", response_model=ClipResponse, status_code=201)
async def create_clip(
    data: ClipCreate,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> ClipResponse:
    temporal_client = await get_temporal_client()
    service = CreateClipService(clip_repo, video_repo, temporal_client)
    clip = await service.execute(data, user.id)
    await db.commit()
    return ClipResponse.model_validate(clip)


@router.get("/", response_model=PaginatedResponse[ClipResponse])
async def list_clips(
    video_id: uuid.UUID | None = None,
    status: ClipStatus | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
) -> PaginatedResponse[ClipResponse]:
    service = ListClipsService(clip_repo)
    return await service.execute(video_id, status, page, page_size)


@router.get("/{clip_id}", response_model=ClipResponse)
async def get_clip(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
) -> ClipResponse:
    service = GetClipService(clip_repo)
    clip = await service.execute(clip_id)
    return ClipResponse.model_validate(clip)


@router.get("/{clip_id}/progress")
async def get_clip_progress(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
) -> dict:
    service = GetClipProgressService(clip_repo)
    return await service.execute(clip_id)


@router.post("/{clip_id}/retry", response_model=ClipResponse)
async def retry_clip(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> ClipResponse:
    temporal_client = await get_temporal_client()
    service = RetryClipService(clip_repo, video_repo, temporal_client)
    result = await service.execute(clip_id)
    await db.commit()
    return ClipResponse.model_validate(result)


@router.get("/{clip_id}/stream-url")
async def get_stream_url(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
) -> dict:
    service = GetStreamUrlService(clip_repo)
    return await service.execute(clip_id)


@router.head("/{clip_id}/stream")
@router.get("/{clip_id}/stream")
async def stream_clip(
    clip_id: uuid.UUID,
    request: Request,
    token: str = Query(),
    clip_repo: ClipRepository = Depends(get_clip_repository),
) -> StreamingResponse:
    service = StreamClipService(clip_repo)
    return await service.execute(clip_id, token, request.headers.get("range"))


@router.delete("/{clip_id}", status_code=204)
async def delete_clip(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = DeleteClipService(clip_repo)
    await service.execute(clip_id)
    await db.commit()
