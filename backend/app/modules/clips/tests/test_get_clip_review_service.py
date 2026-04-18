import uuid
from unittest.mock import AsyncMock

import pytest

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.models import Clip
from app.modules.clips.services.get_clip_review_service import GetClipReviewService
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from app.modules.youtube.models import YouTubeUpload


def _make_clip(
    status: str = ClipStatus.AWAITING_REVIEW,
    selected_title: str | None = "Titulo",
    description: str | None = "Descricao valida.",
) -> Clip:
    return Clip(
        id=uuid.uuid4(),
        video_id=uuid.uuid4(),
        status=status,
        clip_type="sermon",
        start_time=0,
        end_time=60,
        quality="720p",
        selected_title=selected_title,
        description=description,
    )


def _make_upload(youtube_video_id: str | None = "abc123") -> YouTubeUpload:
    return YouTubeUpload(
        id=uuid.uuid4(),
        clip_id=uuid.uuid4(),
        youtube_video_id=youtube_video_id,
        youtube_url=f"https://www.youtube.com/watch?v={youtube_video_id}"
        if youtube_video_id
        else None,
        youtube_status="completed",
        title="Titulo",
        uploaded_by=uuid.uuid4(),
    )


def _make_user(role: UserRole = UserRole.ADMIN) -> User:
    return User(
        id=uuid.uuid4(),
        email="x@y.com",
        name="Test",
        password_hash="hash",
        role=role.value,
        is_active=True,
    )


@pytest.fixture
def clip_repo():
    return AsyncMock()


@pytest.fixture
def upload_repo():
    return AsyncMock()


async def test_review_raises_when_clip_missing(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = None
    service = GetClipReviewService(clip_repo, upload_repo)
    with pytest.raises(ClipNotFoundException):
        await service.execute(uuid.uuid4(), _make_user())


async def test_review_includes_youtube_ids(clip_repo, upload_repo):
    clip = _make_clip()
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = _make_upload("video-xyz")

    service = GetClipReviewService(clip_repo, upload_repo)
    data = await service.execute(clip.id, _make_user())

    assert data.youtube_video_id == "video-xyz"
    assert "video-xyz" in (data.youtube_url or "")


async def test_admin_awaiting_review_can_publish_and_discard(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip()
    upload_repo.get_by_clip_id.return_value = _make_upload()

    service = GetClipReviewService(clip_repo, upload_repo)
    data = await service.execute(uuid.uuid4(), _make_user(UserRole.ADMIN))

    assert data.can_publish is True
    assert data.can_discard is True


async def test_editor_cannot_publish_or_discard(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip()
    upload_repo.get_by_clip_id.return_value = _make_upload()

    service = GetClipReviewService(clip_repo, upload_repo)
    data = await service.execute(uuid.uuid4(), _make_user(UserRole.EDITOR))

    assert data.can_publish is False
    assert data.can_discard is False


async def test_cannot_publish_if_draft_incomplete(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip(selected_title=None)
    upload_repo.get_by_clip_id.return_value = _make_upload()

    service = GetClipReviewService(clip_repo, upload_repo)
    data = await service.execute(uuid.uuid4(), _make_user(UserRole.ADMIN))

    assert data.can_publish is False
    # Discard does not depend on draft content
    assert data.can_discard is True


async def test_cannot_publish_outside_awaiting_review(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip(status=ClipStatus.PUBLISHED)
    upload_repo.get_by_clip_id.return_value = _make_upload()

    service = GetClipReviewService(clip_repo, upload_repo)
    data = await service.execute(uuid.uuid4(), _make_user(UserRole.ADMIN))

    assert data.can_publish is False
    assert data.can_discard is False


async def test_cannot_publish_without_youtube_upload(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip()
    upload_repo.get_by_clip_id.return_value = None

    service = GetClipReviewService(clip_repo, upload_repo)
    data = await service.execute(uuid.uuid4(), _make_user(UserRole.ADMIN))

    assert data.can_publish is False
    assert data.can_discard is False
