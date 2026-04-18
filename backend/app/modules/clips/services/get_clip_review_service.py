import uuid
from dataclasses import dataclass

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.clips.schemas import DESCRIPTION_MAX_LEN, TITLE_MAX_LEN
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)


@dataclass
class ClipReviewData:
    clip: Clip
    youtube_video_id: str | None
    youtube_url: str | None
    can_publish: bool
    can_discard: bool


def _draft_is_publishable(clip: Clip) -> bool:
    title = (clip.selected_title or "").strip()
    description = (clip.description or "").strip()
    if not title or len(title) > TITLE_MAX_LEN:
        return False
    if not description or len(description) > DESCRIPTION_MAX_LEN:
        return False
    return True


class GetClipReviewService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        upload_repo: YouTubeUploadRepository,
    ):
        self.clip_repo = clip_repo
        self.upload_repo = upload_repo

    async def execute(self, clip_id: uuid.UUID, user: User) -> ClipReviewData:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        upload = await self.upload_repo.get_by_clip_id(clip_id)
        youtube_video_id = upload.youtube_video_id if upload else None
        youtube_url = upload.youtube_url if upload else None

        is_admin = user.role == UserRole.ADMIN.value
        is_awaiting_review = clip.status == ClipStatus.AWAITING_REVIEW

        can_publish = (
            is_admin
            and is_awaiting_review
            and bool(youtube_video_id)
            and _draft_is_publishable(clip)
        )
        can_discard = is_admin and is_awaiting_review and bool(youtube_video_id)

        return ClipReviewData(
            clip=clip,
            youtube_video_id=youtube_video_id,
            youtube_url=youtube_url,
            can_publish=can_publish,
            can_discard=can_discard,
        )
