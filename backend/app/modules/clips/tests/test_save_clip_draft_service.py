import uuid
from unittest.mock import AsyncMock

import pytest

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipNotFoundException,
    ClipNotInReviewException,
)
from app.modules.clips.models import Clip
from app.modules.clips.schemas import ClipDraftUpdate
from app.modules.clips.services.save_clip_draft_service import SaveClipDraftService


def _make_clip(status: str = ClipStatus.AWAITING_REVIEW, **overrides) -> Clip:
    defaults = {
        "id": uuid.uuid4(),
        "video_id": uuid.uuid4(),
        "status": status,
        "clip_type": "sermon",
        "start_time": 0,
        "end_time": 60,
        "quality": "720p",
        "selected_title": None,
        "description": None,
        "whatsapp_message": None,
    }
    defaults.update(overrides)
    return Clip(**defaults)


@pytest.fixture
def clip_repo():
    return AsyncMock()


async def test_save_draft_updates_only_provided_fields(clip_repo):
    clip = _make_clip(selected_title="Old", description="Existing")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c

    service = SaveClipDraftService(clip_repo)
    updated = await service.execute(
        clip.id,
        ClipDraftUpdate(selected_title="New title"),
    )

    assert updated.selected_title == "New title"
    assert updated.description == "Existing"


async def test_save_draft_persists_empty_string_when_explicitly_sent(clip_repo):
    clip = _make_clip(description="Old description")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c

    service = SaveClipDraftService(clip_repo)
    updated = await service.execute(clip.id, ClipDraftUpdate(description=""))

    assert updated.description == ""


async def test_save_draft_raises_when_clip_missing(clip_repo):
    clip_repo.get_by_id.return_value = None
    service = SaveClipDraftService(clip_repo)

    with pytest.raises(ClipNotFoundException):
        await service.execute(uuid.uuid4(), ClipDraftUpdate(selected_title="X"))


async def test_save_draft_blocked_outside_awaiting_review(clip_repo):
    clip = _make_clip(status=ClipStatus.PUBLISHED)
    clip_repo.get_by_id.return_value = clip
    service = SaveClipDraftService(clip_repo)

    with pytest.raises(ClipNotInReviewException):
        await service.execute(clip.id, ClipDraftUpdate(selected_title="X"))
