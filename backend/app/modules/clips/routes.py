import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.schemas import PaginatedResponse
from app.core.temporal_client import get_temporal_client
from app.modules.auth.dependencies import get_current_user, require_role
from app.modules.clips.dependencies import get_clip_repository
from app.modules.clips.enums import ClipStatus
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import (
    ClipCreate,
    ClipDraftUpdate,
    ClipPipelineResponse,
    ClipPublishResponse,
    ClipResponse,
    ClipReviewResponse,
    ClipYouTubeStatsResponse,
)
from app.modules.clips.services.create_clip_service import CreateClipService
from app.modules.clips.services.delete_clip_service import DeleteClipService
from app.modules.clips.services.discard_clip_service import DiscardClipService
from app.modules.clips.services.get_clip_pipeline_service import GetClipPipelineService
from app.modules.clips.services.get_clip_progress_service import GetClipProgressService
from app.modules.clips.services.get_clip_review_service import GetClipReviewService
from app.modules.clips.services.get_clip_service import GetClipService
from app.modules.clips.services.get_stream_url_service import GetStreamUrlService
from app.modules.clips.services.list_clips_service import ListClipsService
from app.modules.clips.services.publish_clip_service import PublishClipService
from app.modules.clips.services.retry_clip_service import RetryClipService
from app.modules.clips.services.save_clip_draft_service import SaveClipDraftService
from app.modules.clips.services.stream_clip_service import StreamClipService
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from app.modules.videos.dependencies import get_video_repository
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.youtube.dependencies import (
    get_youtube_connection_repository,
    get_youtube_upload_repository,
)
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)
from app.modules.youtube.services.get_video_stats_service import GetVideoStatsService

REGEN_ALLOWED_FIELDS = {"titles", "description", "whatsapp_message"}

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
    video_repo: VideoRepository = Depends(get_video_repository),
) -> PaginatedResponse[ClipResponse]:
    service = ListClipsService(clip_repo, video_repo)
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


@router.get("/{clip_id}/pipeline", response_model=ClipPipelineResponse)
async def get_clip_pipeline(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
) -> ClipPipelineResponse:
    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip_id)
    return ClipPipelineResponse.model_validate(
        {
            "download": pipeline.download,
            "trim": pipeline.trim,
            "upload": pipeline.upload,
        }
    )


@router.get("/{clip_id}/youtube-stats", response_model=ClipYouTubeStatsResponse)
async def get_clip_youtube_stats(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
) -> ClipYouTubeStatsResponse:
    service = GetVideoStatsService(connection_repo, upload_repo)
    stats = await service.execute(clip_id)
    return ClipYouTubeStatsResponse(
        view_count=stats.view_count,
        like_count=stats.like_count,
        comment_count=stats.comment_count,
    )


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


@router.get("/{clip_id}/review", response_model=ClipReviewResponse)
async def get_clip_review(
    clip_id: uuid.UUID,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
) -> ClipReviewResponse:
    service = GetClipReviewService(clip_repo, upload_repo)
    data = await service.execute(clip_id, user)
    return ClipReviewResponse(
        id=data.clip.id,
        video_id=data.clip.video_id,
        status=ClipStatus(data.clip.status),
        start_time=data.clip.start_time,
        end_time=data.clip.end_time,
        duration=data.clip.duration,
        file_path=data.clip.file_path,
        generated_titles=data.clip.generated_titles,
        generated_description=data.clip.generated_description,
        generated_whatsapp_message=data.clip.generated_whatsapp_message,
        selected_title=data.clip.selected_title,
        description=data.clip.description,
        whatsapp_message=data.clip.whatsapp_message,
        published_at=data.clip.published_at,
        discarded_at=data.clip.discarded_at,
        youtube_video_id=data.youtube_video_id,
        youtube_url=data.youtube_url,
        can_publish=data.can_publish,
        can_discard=data.can_discard,
    )


@router.patch("/{clip_id}/draft", response_model=ClipResponse)
async def save_clip_draft(
    clip_id: uuid.UUID,
    data: ClipDraftUpdate,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    db: AsyncSession = Depends(get_db),
) -> ClipResponse:
    service = SaveClipDraftService(clip_repo)
    clip = await service.execute(clip_id, data)
    await db.commit()
    return ClipResponse.model_validate(clip)


@router.post("/{clip_id}/publish", response_model=ClipPublishResponse)
async def publish_clip(
    clip_id: uuid.UUID,
    user: User = Depends(require_role(UserRole.ADMIN)),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
    db: AsyncSession = Depends(get_db),
) -> ClipPublishResponse:
    service = PublishClipService(clip_repo, upload_repo)
    clip = await service.execute(clip_id)
    await db.commit()
    upload = await upload_repo.get_by_clip_id(clip_id)
    return ClipPublishResponse(
        id=clip.id,
        status=ClipStatus(clip.status),
        published_at=clip.published_at,
        youtube_url=upload.youtube_url if upload else None,
    )


@router.post("/{clip_id}/discard", response_model=ClipResponse)
async def discard_clip(
    clip_id: uuid.UUID,
    user: User = Depends(require_role(UserRole.ADMIN)),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
    db: AsyncSession = Depends(get_db),
) -> ClipResponse:
    temporal_client = await get_temporal_client()
    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    clip = await service.execute(clip_id)
    await db.commit()
    return ClipResponse.model_validate(clip)


@router.post("/{clip_id}/regenerate/{field}", status_code=501)
async def regenerate_clip_field(
    clip_id: uuid.UUID,
    field: str = Path(..., description="titles | description | whatsapp_message"),
    user: User = Depends(get_current_user),
) -> dict:
    if field not in REGEN_ALLOWED_FIELDS:
        raise HTTPException(status_code=422, detail=f"Campo invalido: {field}")
    raise HTTPException(
        status_code=501,
        detail="Geracao de conteudo por IA ainda nao esta disponivel.",
    )
