import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token
from app.core.temporal_client import get_temporal_client
from app.modules.auth.dependencies import require_role
from app.modules.clips.dependencies import get_clip_repository
from app.modules.clips.repositories.clip_repository import ClipRepository
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
from app.modules.youtube.schemas import (
    OAuthAuthorizeResponse,
    QuotaResponse,
    UploadRequest,
    YouTubeConnectionResponse,
    YouTubeUploadResponse,
)
from app.modules.youtube.services.disconnect_channel_service import DisconnectChannelService
from app.modules.youtube.services.get_connection_service import GetConnectionService
from app.modules.youtube.services.get_oauth_url_service import GetOAuthUrlService
from app.modules.youtube.services.get_quota_service import GetQuotaService
from app.modules.youtube.services.handle_oauth_callback_service import (
    HandleOAuthCallbackService,
)
from app.modules.youtube.services.trigger_upload_service import TriggerUploadService

router = APIRouter(prefix="/api/youtube", tags=["youtube"])


OAUTH_REDIRECT_URI = f"{settings.YOUTUBE_REDIRECT_BASE_URL}/api/youtube/oauth/callback"


# --- OAuth ---


@router.get("/oauth/authorize", response_model=OAuthAuthorizeResponse)
async def youtube_oauth_authorize(
    user: User = Depends(require_role(UserRole.ADMIN)),
) -> OAuthAuthorizeResponse:
    service = GetOAuthUrlService(redirect_uri=OAUTH_REDIRECT_URI)
    url = service.execute(user.id)
    return OAuthAuthorizeResponse(authorize_url=url)


@router.get("/oauth/callback")
async def youtube_oauth_callback(
    code: str,
    state: str,
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"

    try:
        payload = decode_token(state)
        if payload.get("purpose") != "youtube_oauth":
            raise UnauthorizedException()
        user_id = uuid.UUID(payload["sub"])
        code_verifier = payload.get("cv")
    except Exception:
        return RedirectResponse(url=f"{frontend_url}/settings?youtube=error")

    service = HandleOAuthCallbackService(connection_repo)
    try:
        await service.execute(code, OAUTH_REDIRECT_URI, user_id, code_verifier)
        await db.commit()
    except Exception:
        return RedirectResponse(url=f"{frontend_url}/settings?youtube=error")

    return RedirectResponse(url=f"{frontend_url}/settings?youtube=connected")


# --- Connection ---


@router.get("/connection")
async def get_youtube_connection(
    user: User = Depends(require_role(UserRole.ADMIN)),
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
) -> YouTubeConnectionResponse | None:
    service = GetConnectionService(connection_repo)
    connection = await service.execute()
    if not connection:
        return None
    return YouTubeConnectionResponse.model_validate(connection)


@router.delete("/connection", status_code=204)
async def disconnect_youtube(
    user: User = Depends(require_role(UserRole.ADMIN)),
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = DisconnectChannelService(connection_repo)
    await service.execute()
    await db.commit()


# --- Upload ---


@router.post("/uploads", response_model=YouTubeUploadResponse, status_code=201)
async def trigger_upload(
    data: UploadRequest,
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.EDITOR)),
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> YouTubeUploadResponse:
    temporal_client = await get_temporal_client()
    service = TriggerUploadService(
        connection_repo, upload_repo, clip_repo, video_repo, temporal_client
    )
    upload = await service.execute(data.clip_id, user.id, data.title, data.description)
    await db.commit()
    return YouTubeUploadResponse.model_validate(upload)


# --- Upload status ---


@router.get("/uploads/clip/{clip_id}", response_model=YouTubeUploadResponse | None)
async def get_upload_by_clip(
    clip_id: uuid.UUID,
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.EDITOR)),
    upload_repo: YouTubeUploadRepository = Depends(get_youtube_upload_repository),
) -> YouTubeUploadResponse | None:
    upload = await upload_repo.get_by_clip_id(clip_id)
    if not upload:
        return None
    return YouTubeUploadResponse.model_validate(upload)


# --- Quota ---


@router.get("/quota", response_model=QuotaResponse)
async def get_quota(
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.EDITOR)),
    connection_repo: YouTubeConnectionRepository = Depends(
        get_youtube_connection_repository
    ),
) -> QuotaResponse:
    service = GetQuotaService(connection_repo)
    return await service.execute()
