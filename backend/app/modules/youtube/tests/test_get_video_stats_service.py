import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.modules.youtube.models import YouTubeConnection, YouTubeUpload
from app.modules.youtube.services.get_video_stats_service import (
    GetVideoStatsService,
    VideoStats,
)
from app.modules.youtube.services.get_video_stats_service import _cache


@pytest.fixture(autouse=True)
def _clear_cache():
    _cache.clear()
    yield
    _cache.clear()


def _make_upload(
    youtube_video_id: str | None = "yt-123",
) -> YouTubeUpload:
    return YouTubeUpload(
        id=uuid.uuid4(),
        clip_id=uuid.uuid4(),
        youtube_video_id=youtube_video_id,
        youtube_url=(
            f"https://youtube.com/watch?v={youtube_video_id}"
            if youtube_video_id
            else None
        ),
        youtube_status="completed",
        title="x",
        uploaded_by=uuid.uuid4(),
    )


def _make_connection() -> YouTubeConnection:
    return YouTubeConnection(
        id=uuid.uuid4(),
        access_token="enc-access",
        refresh_token="enc-refresh",
        channel_id="UC1",
        channel_title="Canal Teste",
        daily_quota_used=0,
        connected_by=uuid.uuid4(),
    )


@pytest.fixture
def connection_repo():
    return AsyncMock()


@pytest.fixture
def upload_repo():
    return AsyncMock()


async def test_stats_empty_when_no_upload(connection_repo, upload_repo):
    upload_repo.get_by_clip_id.return_value = None
    service = GetVideoStatsService(connection_repo, upload_repo)

    stats = await service.execute(uuid.uuid4())

    assert stats.view_count is None
    assert stats.like_count is None


async def test_stats_empty_when_upload_has_no_video_id(connection_repo, upload_repo):
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id=None)
    service = GetVideoStatsService(connection_repo, upload_repo)

    stats = await service.execute(uuid.uuid4())

    assert stats.view_count is None


async def test_stats_empty_when_no_connection(connection_repo, upload_repo):
    upload_repo.get_by_clip_id.return_value = _make_upload()
    connection_repo.get_active.return_value = None
    service = GetVideoStatsService(connection_repo, upload_repo)

    stats = await service.execute(uuid.uuid4())

    assert stats.view_count is None


async def test_stats_returns_api_values(connection_repo, upload_repo):
    upload_repo.get_by_clip_id.return_value = _make_upload()
    connection_repo.get_active.return_value = _make_connection()

    with patch(
        "app.modules.youtube.services.get_video_stats_service.decrypt_token",
        lambda x: x,
    ), patch(
        "app.modules.youtube.services.get_video_stats_service._fetch_stats",
        return_value=VideoStats(view_count=1234, like_count=56, comment_count=7),
    ):
        service = GetVideoStatsService(connection_repo, upload_repo)
        stats = await service.execute(uuid.uuid4())

    assert stats.view_count == 1234
    assert stats.like_count == 56
    assert stats.comment_count == 7


async def test_stats_cache_hit(connection_repo, upload_repo):
    upload_repo.get_by_clip_id.return_value = _make_upload()
    connection_repo.get_active.return_value = _make_connection()

    call_count = 0

    def _counting_fetch(**kwargs):
        nonlocal call_count
        call_count += 1
        return VideoStats(view_count=10, like_count=1, comment_count=0)

    with patch(
        "app.modules.youtube.services.get_video_stats_service.decrypt_token",
        lambda x: x,
    ), patch(
        "app.modules.youtube.services.get_video_stats_service._fetch_stats",
        side_effect=_counting_fetch,
    ):
        service = GetVideoStatsService(connection_repo, upload_repo)
        first = await service.execute(uuid.uuid4())
        second = await service.execute(uuid.uuid4())

    assert first == second
    assert call_count == 1


async def test_stats_swallows_api_errors(connection_repo, upload_repo):
    upload_repo.get_by_clip_id.return_value = _make_upload()
    connection_repo.get_active.return_value = _make_connection()

    with patch(
        "app.modules.youtube.services.get_video_stats_service.decrypt_token",
        lambda x: x,
    ), patch(
        "app.modules.youtube.services.get_video_stats_service._fetch_stats",
        side_effect=RuntimeError("quota exceeded"),
    ):
        service = GetVideoStatsService(connection_repo, upload_repo)
        stats = await service.execute(uuid.uuid4())

    assert stats.view_count is None
    assert stats.like_count is None
