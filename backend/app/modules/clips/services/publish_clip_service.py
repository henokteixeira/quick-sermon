import asyncio
import uuid
from datetime import datetime, timezone

import structlog
from googleapiclient.errors import HttpError

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipNotFoundException,
    ClipNotInReviewException,
    ClipUploadMissingException,
    InvalidClipDraftException,
)
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import DESCRIPTION_MAX_LEN, TITLE_MAX_LEN
from app.modules.youtube.activities import update_youtube_privacy
from app.modules.youtube.exceptions import (
    YouTubeApiException,
    YouTubeInsufficientScopeException,
    YouTubeVideoNotFoundException,
)
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)

logger = structlog.get_logger()


class PublishClipService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        upload_repo: YouTubeUploadRepository,
    ):
        self.clip_repo = clip_repo
        self.upload_repo = upload_repo

    async def execute(self, clip_id: uuid.UUID) -> Clip:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if clip.status != ClipStatus.AWAITING_REVIEW:
            raise ClipNotInReviewException(clip.status)

        self._validate_draft(clip)

        upload = await self.upload_repo.get_by_clip_id(clip_id)
        if not upload or not upload.youtube_video_id:
            raise ClipUploadMissingException()

        video_id = upload.youtube_video_id

        try:
            await asyncio.to_thread(update_youtube_privacy, video_id, "public")
        except HttpError as exc:
            status = getattr(exc.resp, "status", None)
            reason = _parse_reason(exc)
            logger.warning(
                "youtube_publish_failed",
                clip_id=str(clip_id),
                video_id=video_id,
                status=status,
                reason=reason,
            )
            if status == 403 and reason == "insufficientPermissions":
                raise YouTubeInsufficientScopeException()
            if status == 404:
                raise YouTubeVideoNotFoundException()
            raise YouTubeApiException(
                f"Falha ao publicar no YouTube ({status or 'erro'})."
            )

        clip.status = ClipStatus.PUBLISHED
        clip.published_at = datetime.now(timezone.utc)
        await self.clip_repo.update(clip)

        logger.info("clip_published", clip_id=str(clip_id), youtube_video_id=video_id)
        return clip

    @staticmethod
    def _validate_draft(clip: Clip) -> None:  # noqa: D401
        """Validate draft fields before publishing."""
        title = (clip.selected_title or "").strip()
        description = (clip.description or "").strip()
        if not title:
            raise InvalidClipDraftException("Selecione ou escreva um titulo antes de publicar.")
        if len(title) > TITLE_MAX_LEN:
            raise InvalidClipDraftException(
                f"Titulo excede o limite de {TITLE_MAX_LEN} caracteres."
            )
        if not description:
            raise InvalidClipDraftException(
                "Descricao eh obrigatoria antes de publicar."
            )
        if len(description) > DESCRIPTION_MAX_LEN:
            raise InvalidClipDraftException(
                f"Descricao excede o limite de {DESCRIPTION_MAX_LEN} caracteres."
            )


def _parse_reason(exc: HttpError) -> str | None:
    try:
        import json

        payload = json.loads(exc.content.decode("utf-8"))
        errors = payload.get("error", {}).get("errors") or []
        if errors:
            return errors[0].get("reason")
    except Exception:
        return None
    return None
