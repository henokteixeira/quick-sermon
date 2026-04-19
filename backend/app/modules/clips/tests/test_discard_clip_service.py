import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from temporalio.service import RPCError, RPCStatusCode

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipAlreadyDiscardedException,
    ClipAlreadyPublishedException,
    ClipNotFoundException,
)
from app.modules.clips.models import Clip
from app.modules.clips.services.discard_clip_service import DiscardClipService
from app.modules.youtube.models import YouTubeUpload


def _make_clip(
    status: str = ClipStatus.AWAITING_REVIEW,
    workflow_id: str | None = None,
) -> Clip:
    return Clip(
        id=uuid.uuid4(),
        video_id=uuid.uuid4(),
        status=status,
        clip_type="sermon",
        start_time=0,
        end_time=60,
        quality="720p",
        temporal_workflow_id=workflow_id,
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


@pytest.fixture
def temporal_client():
    client = MagicMock()
    handle = MagicMock()
    handle.cancel = AsyncMock()
    client.get_workflow_handle = MagicMock(return_value=handle)
    return client


@pytest.fixture(autouse=True)
def _patch_youtube(monkeypatch):
    monkeypatch.setattr(
        "app.modules.clips.services.discard_clip_service.delete_youtube_video",
        lambda video_id: None,
    )


async def test_discard_happy_path(clip_repo, upload_repo, temporal_client):
    clip = _make_clip()
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload()

    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.DISCARDED
    assert result.discarded_at is not None
    # No active pipeline, Temporal should not be touched.
    temporal_client.get_workflow_handle.assert_not_called()


async def test_discard_raises_when_clip_missing(clip_repo, upload_repo, temporal_client):
    clip_repo.get_by_id.return_value = None
    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    with pytest.raises(ClipNotFoundException):
        await service.execute(uuid.uuid4())


async def test_discard_blocks_published(clip_repo, upload_repo, temporal_client):
    clip_repo.get_by_id.return_value = _make_clip(status=ClipStatus.PUBLISHED)
    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    with pytest.raises(ClipAlreadyPublishedException):
        await service.execute(uuid.uuid4())


async def test_discard_blocks_already_discarded(clip_repo, upload_repo, temporal_client):
    clip_repo.get_by_id.return_value = _make_clip(status=ClipStatus.DISCARDED)
    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    with pytest.raises(ClipAlreadyDiscardedException):
        await service.execute(uuid.uuid4())


async def test_discard_works_without_upload(clip_repo, upload_repo, temporal_client):
    clip = _make_clip()
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = None

    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.DISCARDED


async def test_discard_ignores_youtube_delete_failure(
    clip_repo, upload_repo, temporal_client, monkeypatch
):
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

    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.DISCARDED


async def test_discard_cancels_workflow_when_downloading(
    clip_repo, upload_repo, temporal_client
):
    clip = _make_clip(status=ClipStatus.DOWNLOADING, workflow_id="clip-abc")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = None

    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    result = await service.execute(clip.id)

    temporal_client.get_workflow_handle.assert_called_once_with("clip-abc")
    handle = temporal_client.get_workflow_handle.return_value
    handle.cancel.assert_awaited_once()
    assert result.status == ClipStatus.DISCARDED


async def test_discard_cancels_workflow_when_uploading(
    clip_repo, upload_repo, temporal_client
):
    clip = _make_clip(
        status=ClipStatus.UPLOADING, workflow_id="youtube-upload-xyz"
    )
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload()

    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    result = await service.execute(clip.id)

    temporal_client.get_workflow_handle.assert_called_once_with(
        "youtube-upload-xyz"
    )
    assert result.status == ClipStatus.DISCARDED


async def test_discard_survives_cancel_failure(
    clip_repo, upload_repo, temporal_client
):
    clip = _make_clip(status=ClipStatus.DOWNLOADING, workflow_id="clip-abc")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = None

    handle = temporal_client.get_workflow_handle.return_value
    handle.cancel.side_effect = RPCError(
        "workflow not found", RPCStatusCode.NOT_FOUND, b""
    )

    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    result = await service.execute(clip.id)

    assert result.status == ClipStatus.DISCARDED


async def test_discard_error_status_does_not_cancel_workflow(
    clip_repo, upload_repo, temporal_client
):
    clip = _make_clip(status=ClipStatus.ERROR, workflow_id="clip-abc")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = None

    service = DiscardClipService(clip_repo, upload_repo, temporal_client)
    result = await service.execute(clip.id)

    temporal_client.get_workflow_handle.assert_not_called()
    assert result.status == ClipStatus.DISCARDED
