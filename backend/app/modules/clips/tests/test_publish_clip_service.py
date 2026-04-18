import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipNotFoundException,
    ClipNotInReviewException,
    ClipUploadMissingException,
    InvalidClipDraftException,
)
from app.modules.clips.models import Clip
from app.modules.clips.services.publish_clip_service import PublishClipService
from app.modules.youtube.models import YouTubeUpload


def _make_clip(
    status: str = ClipStatus.AWAITING_REVIEW,
    selected_title: str | None = "Titulo decidido",
    description: str | None = "Descricao preenchida e valida.",
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
        title="Titulo decidido",
        description="Descricao preenchida e valida.",
        uploaded_by=uuid.uuid4(),
    )


@pytest.fixture
def clip_repo():
    return AsyncMock()


@pytest.fixture
def upload_repo():
    return AsyncMock()


@pytest.fixture(autouse=True)
def _patch_youtube(monkeypatch):
    monkeypatch.setattr(
        "app.modules.clips.services.publish_clip_service.update_youtube_privacy",
        lambda video_id, privacy_status: None,
    )


async def test_publish_happy_path_flips_privacy_and_marks_published(clip_repo, upload_repo):
    clip = _make_clip()
    upload = _make_upload()
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = upload

    service = PublishClipService(clip_repo, upload_repo)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.PUBLISHED
    assert result.published_at is not None


async def test_publish_calls_update_privacy_with_public(clip_repo, upload_repo):
    clip = _make_clip()
    upload = _make_upload(youtube_video_id="video-xyz")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = upload

    called = {}

    def fake_update(video_id, privacy_status):
        called["video_id"] = video_id
        called["privacy_status"] = privacy_status

    with patch(
        "app.modules.clips.services.publish_clip_service.update_youtube_privacy",
        fake_update,
    ):
        service = PublishClipService(clip_repo, upload_repo)
        await service.execute(clip.id)

    assert called == {"video_id": "video-xyz", "privacy_status": "public"}


async def test_publish_raises_when_clip_missing(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = None
    service = PublishClipService(clip_repo, upload_repo)
    with pytest.raises(ClipNotFoundException):
        await service.execute(uuid.uuid4())


async def test_publish_blocked_when_not_in_review(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip(status=ClipStatus.PUBLISHED)
    service = PublishClipService(clip_repo, upload_repo)
    with pytest.raises(ClipNotInReviewException):
        await service.execute(uuid.uuid4())


async def test_publish_rejects_missing_title(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip(selected_title=None)
    service = PublishClipService(clip_repo, upload_repo)
    with pytest.raises(InvalidClipDraftException):
        await service.execute(uuid.uuid4())


async def test_publish_rejects_missing_description(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip(description="   ")
    service = PublishClipService(clip_repo, upload_repo)
    with pytest.raises(InvalidClipDraftException):
        await service.execute(uuid.uuid4())


async def test_publish_rejects_title_over_limit(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip(selected_title="X" * 101)
    service = PublishClipService(clip_repo, upload_repo)
    with pytest.raises(InvalidClipDraftException):
        await service.execute(uuid.uuid4())


async def test_publish_requires_youtube_upload(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip()
    upload_repo.get_by_clip_id.return_value = None
    service = PublishClipService(clip_repo, upload_repo)
    with pytest.raises(ClipUploadMissingException):
        await service.execute(uuid.uuid4())


async def test_publish_requires_youtube_video_id(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip()
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id=None)
    service = PublishClipService(clip_repo, upload_repo)
    with pytest.raises(ClipUploadMissingException):
        await service.execute(uuid.uuid4())
