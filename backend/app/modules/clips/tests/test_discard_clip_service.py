import uuid
from unittest.mock import AsyncMock

import pytest

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipNotFoundException,
    ClipNotInReviewException,
)
from app.modules.clips.models import Clip
from app.modules.clips.services.discard_clip_service import DiscardClipService
from app.modules.youtube.models import YouTubeUpload


def _make_clip(status: str = ClipStatus.AWAITING_REVIEW) -> Clip:
    return Clip(
        id=uuid.uuid4(),
        video_id=uuid.uuid4(),
        status=status,
        clip_type="sermon",
        start_time=0,
        end_time=60,
        quality="720p",
    )


def _make_upload(youtube_video_id: str | None = "abc123") -> YouTubeUpload:
    return YouTubeUpload(
        id=uuid.uuid4(),
        clip_id=uuid.uuid4(),
        youtube_video_id=youtube_video_id,
        youtube_url="https://youtube.com/watch?v=abc123" if youtube_video_id else None,
        youtube_status="completed",
        title="x",
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
        "app.modules.clips.services.discard_clip_service.delete_youtube_video",
        lambda video_id: None,
    )


async def test_discard_happy_path(clip_repo, upload_repo):
    clip = _make_clip()
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload()

    service = DiscardClipService(clip_repo, upload_repo)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.DISCARDED
    assert result.discarded_at is not None


async def test_discard_raises_when_clip_missing(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = None
    service = DiscardClipService(clip_repo, upload_repo)
    with pytest.raises(ClipNotFoundException):
        await service.execute(uuid.uuid4())


async def test_discard_blocked_outside_awaiting_review(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = _make_clip(status=ClipStatus.PUBLISHED)
    service = DiscardClipService(clip_repo, upload_repo)
    with pytest.raises(ClipNotInReviewException):
        await service.execute(uuid.uuid4())


async def test_discard_works_without_upload(clip_repo, upload_repo):
    clip = _make_clip()
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = None

    service = DiscardClipService(clip_repo, upload_repo)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.DISCARDED


async def test_discard_ignores_youtube_delete_failure(clip_repo, upload_repo, monkeypatch):
    clip = _make_clip()
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload()

    def failing_delete(_video_id):
        raise RuntimeError("YouTube API down")

    monkeypatch.setattr(
        "app.modules.clips.services.discard_clip_service.delete_youtube_video",
        failing_delete,
    )

    service = DiscardClipService(clip_repo, upload_repo)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.DISCARDED
