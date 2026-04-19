import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from app.modules.clips.enums import ClipErrorCode, ClipStatus
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.models import Clip
from app.modules.clips.services.get_clip_pipeline_service import (
    GetClipPipelineService,
)
from app.modules.youtube.enums import YouTubeUploadStatus
from app.modules.youtube.models import YouTubeUpload


def _make_clip(**overrides) -> Clip:
    defaults = {
        "id": uuid.uuid4(),
        "video_id": uuid.uuid4(),
        "status": ClipStatus.PENDING,
        "clip_type": "sermon",
        "start_time": 0,
        "end_time": 60,
        "quality": "720p",
    }
    defaults.update(overrides)
    return Clip(**defaults)


def _make_upload(status: str = YouTubeUploadStatus.COMPLETED, **overrides) -> YouTubeUpload:
    defaults = {
        "id": uuid.uuid4(),
        "clip_id": uuid.uuid4(),
        "youtube_status": status,
        "title": "x",
        "uploaded_by": uuid.uuid4(),
    }
    defaults.update(overrides)
    return YouTubeUpload(**defaults)


@pytest.fixture
def clip_repo():
    return AsyncMock()


@pytest.fixture
def upload_repo():
    return AsyncMock()


@pytest.fixture
def progress_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(
        "app.modules.clips.services.get_clip_pipeline_service.settings.CLIPS_BASE_DIR",
        str(tmp_path),
    )
    return tmp_path


def _write_progress(progress_dir, clip_id: uuid.UUID, data: dict) -> None:
    clip_dir = progress_dir / str(clip_id)
    clip_dir.mkdir(parents=True, exist_ok=True)
    (clip_dir / "progress.json").write_text(json.dumps(data))


async def test_pipeline_raises_when_clip_missing(clip_repo, upload_repo, progress_dir):
    clip_repo.get_by_id.return_value = None
    service = GetClipPipelineService(clip_repo, upload_repo)
    with pytest.raises(ClipNotFoundException):
        await service.execute(uuid.uuid4())


async def test_pipeline_all_pending(clip_repo, upload_repo, progress_dir):
    clip = _make_clip(status=ClipStatus.PENDING)
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = None

    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip.id)

    assert pipeline.download.status == "pending"
    assert pipeline.trim.status == "pending"
    assert pipeline.upload.status == "pending"


async def test_pipeline_downloading_with_progress(
    clip_repo, upload_repo, progress_dir
):
    clip = _make_clip(status=ClipStatus.DOWNLOADING)
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = None
    _write_progress(
        progress_dir,
        clip.id,
        {"stage": "downloading", "percent": 42.5, "speed": "1.5MB/s"},
    )

    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip.id)

    assert pipeline.download.status == "running"
    assert pipeline.download.percent == 42.5
    assert pipeline.download.speed == "1.5MB/s"
    assert pipeline.trim.status == "pending"


async def test_pipeline_download_complete_trim_running(
    clip_repo, upload_repo, progress_dir
):
    now = datetime.now(timezone.utc)
    clip = _make_clip(
        status=ClipStatus.TRIMMING,
        downloaded_at=now,
    )
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = None
    _write_progress(
        progress_dir,
        clip.id,
        {"stage": "trimming", "percent": 75.0, "speed": None},
    )

    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip.id)

    assert pipeline.download.status == "completed"
    assert pipeline.download.completed_at == now
    assert pipeline.trim.status == "running"
    assert pipeline.trim.percent == 75.0


async def test_pipeline_download_error(clip_repo, upload_repo, progress_dir):
    clip = _make_clip(
        status=ClipStatus.ERROR,
        error_code=ClipErrorCode.DOWNLOAD_FAILED,
        error_message="network timeout",
    )
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = None

    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip.id)

    assert pipeline.download.status == "error"
    assert pipeline.download.error_code == ClipErrorCode.DOWNLOAD_FAILED
    assert pipeline.download.error_message == "network timeout"
    assert pipeline.trim.status == "pending"


async def test_pipeline_upload_completed_with_timestamps(
    clip_repo, upload_repo, progress_dir
):
    now = datetime.now(timezone.utc)
    clip = _make_clip(
        status=ClipStatus.AWAITING_REVIEW,
        downloaded_at=now,
        trimmed_at=now,
        uploaded_at=now,
    )
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = _make_upload(clip_id=clip.id)

    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip.id)

    assert pipeline.download.status == "completed"
    assert pipeline.trim.status == "completed"
    assert pipeline.upload.status == "completed"
    assert pipeline.upload.completed_at == now


async def test_pipeline_upload_failed(clip_repo, upload_repo, progress_dir):
    now = datetime.now(timezone.utc)
    clip = _make_clip(
        status=ClipStatus.READY,
        downloaded_at=now,
        trimmed_at=now,
    )
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = _make_upload(
        clip_id=clip.id,
        status=YouTubeUploadStatus.FAILED,
        error_code="UPLOAD_FAILED",
        error_message="token revoked",
    )

    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip.id)

    assert pipeline.upload.status == "error"
    assert pipeline.upload.error_code == "UPLOAD_FAILED"
    assert pipeline.upload.error_message == "token revoked"


async def test_pipeline_ignores_stale_progress_file(
    clip_repo, upload_repo, progress_dir
):
    clip = _make_clip(status=ClipStatus.DOWNLOADING)
    clip_repo.get_by_id.return_value = clip
    upload_repo.get_by_clip_id.return_value = None
    # progress file still has trimming data from a previous stage — should be ignored
    _write_progress(
        progress_dir,
        clip.id,
        {"stage": "trimming", "percent": 99.0},
    )

    service = GetClipPipelineService(clip_repo, upload_repo)
    pipeline = await service.execute(clip.id)

    assert pipeline.download.status == "running"
    assert pipeline.download.percent is None
