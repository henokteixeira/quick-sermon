import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from app.modules.youtube.exceptions import YouTubeConnectionNotFoundException
from app.modules.youtube.models import YouTubeConnection
from app.modules.youtube.services.get_quota_service import GetQuotaService


def _make_connection(daily_quota_used: int = 0, quota_reset_date: str | None = None):
    conn = YouTubeConnection(
        id=uuid.uuid4(),
        access_token="enc",
        refresh_token="enc",
        channel_id="UC123",
        channel_title="Test Church",
        daily_quota_used=daily_quota_used,
        quota_reset_date=quota_reset_date,
        connected_by=uuid.uuid4(),
    )
    return conn


@pytest.fixture
def repo():
    return AsyncMock()


async def test_no_connection_raises(repo):
    repo.get_active.return_value = None
    service = GetQuotaService(repo)
    with pytest.raises(YouTubeConnectionNotFoundException):
        await service.execute()


async def test_fresh_day_returns_zero_usage(repo):
    repo.get_active.return_value = _make_connection(
        daily_quota_used=3200, quota_reset_date="2020-01-01"
    )
    service = GetQuotaService(repo)
    result = await service.execute()
    assert result.used == 0
    assert result.blocked is False
    assert result.warning is False


async def test_quota_warning_at_80_percent(repo):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    repo.get_active.return_value = _make_connection(
        daily_quota_used=8000, quota_reset_date=today
    )
    service = GetQuotaService(repo)
    result = await service.execute()
    assert result.warning is True
    assert result.blocked is False


async def test_quota_blocked_when_insufficient(repo):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    repo.get_active.return_value = _make_connection(
        daily_quota_used=9600, quota_reset_date=today
    )
    service = GetQuotaService(repo)
    result = await service.execute()
    assert result.blocked is True
    assert result.remaining < 1600
