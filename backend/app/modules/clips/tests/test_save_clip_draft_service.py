import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import (
    ClipAlreadyDiscardedException,
    ClipAlreadyPublishedException,
    ClipNotFoundException,
)
from app.modules.clips.models import Clip
from app.modules.clips.schemas import ClipDraftUpdate
from app.modules.clips.services.save_clip_draft_service import SaveClipDraftService
from app.modules.youtube.models import YouTubeUpload


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


def _make_upload(youtube_video_id: str | None = "abc123") -> YouTubeUpload:
    return YouTubeUpload(
        id=uuid.uuid4(),
        clip_id=uuid.uuid4(),
        youtube_video_id=youtube_video_id,
        youtube_url=f"https://www.youtube.com/watch?v={youtube_video_id}"
        if youtube_video_id
        else None,
        youtube_status="completed",
        title="Titulo enviado",
        description="Descricao enviada.",
        uploaded_by=uuid.uuid4(),
    )


@pytest.fixture
def clip_repo():
    return AsyncMock()


@pytest.fixture
def upload_repo():
    repo = AsyncMock()
    repo.get_by_clip_id.return_value = None
    return repo


@pytest.fixture(autouse=True)
def _patch_youtube(monkeypatch):
    monkeypatch.setattr(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        lambda video_id, title, description: None,
    )


async def test_save_draft_updates_only_provided_fields(clip_repo, upload_repo):
    clip = _make_clip(selected_title="Old", description="Existing")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c

    service = SaveClipDraftService(clip_repo, upload_repo)
    updated = await service.execute(
        clip.id,
        ClipDraftUpdate(selected_title="New title"),
    )

    assert updated.selected_title == "New title"
    assert updated.description == "Existing"


async def test_save_draft_persists_empty_string_when_explicitly_sent(clip_repo, upload_repo):
    clip = _make_clip(description="Old description")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c

    service = SaveClipDraftService(clip_repo, upload_repo)
    updated = await service.execute(clip.id, ClipDraftUpdate(description=""))

    assert updated.description == ""


async def test_save_draft_raises_when_clip_missing(clip_repo, upload_repo):
    clip_repo.get_by_id.return_value = None
    service = SaveClipDraftService(clip_repo, upload_repo)

    with pytest.raises(ClipNotFoundException):
        await service.execute(uuid.uuid4(), ClipDraftUpdate(selected_title="X"))


async def test_save_draft_blocked_when_published(clip_repo, upload_repo):
    clip = _make_clip(status=ClipStatus.PUBLISHED)
    clip_repo.get_by_id.return_value = clip
    service = SaveClipDraftService(clip_repo, upload_repo)

    with pytest.raises(ClipAlreadyPublishedException):
        await service.execute(clip.id, ClipDraftUpdate(selected_title="X"))


async def test_save_draft_blocked_when_discarded(clip_repo, upload_repo):
    clip = _make_clip(status=ClipStatus.DISCARDED)
    clip_repo.get_by_id.return_value = clip
    service = SaveClipDraftService(clip_repo, upload_repo)

    with pytest.raises(ClipAlreadyDiscardedException):
        await service.execute(clip.id, ClipDraftUpdate(selected_title="X"))


@pytest.mark.parametrize(
    "status",
    [
        ClipStatus.PENDING,
        ClipStatus.DOWNLOADING,
        ClipStatus.TRIMMING,
        ClipStatus.READY,
        ClipStatus.UPLOADING,
        ClipStatus.AWAITING_REVIEW,
        ClipStatus.ERROR,
    ],
)
async def test_save_draft_allowed_in_non_terminal_statuses(clip_repo, upload_repo, status):
    clip = _make_clip(status=status)
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c

    service = SaveClipDraftService(clip_repo, upload_repo)
    updated = await service.execute(
        clip.id,
        ClipDraftUpdate(selected_title="New"),
    )

    assert updated.selected_title == "New"


async def test_save_draft_syncs_to_youtube_when_title_changed(clip_repo, upload_repo):
    clip = _make_clip(selected_title="Antigo", description="Descricao.")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id="yt-1")

    called: list[tuple] = []

    def fake_snippet(video_id, title, description):
        called.append((video_id, title, description))

    with patch(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        fake_snippet,
    ):
        service = SaveClipDraftService(clip_repo, upload_repo)
        await service.execute(
            clip.id, ClipDraftUpdate(selected_title="Novo titulo")
        )

    assert called == [("yt-1", "Novo titulo", "Descricao.")]


async def test_save_draft_syncs_to_youtube_when_description_changed(clip_repo, upload_repo):
    clip = _make_clip(selected_title="Titulo.", description="Antiga.")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id="yt-2")

    called: list[tuple] = []

    def fake_snippet(video_id, title, description):
        called.append((video_id, title, description))

    with patch(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        fake_snippet,
    ):
        service = SaveClipDraftService(clip_repo, upload_repo)
        await service.execute(
            clip.id, ClipDraftUpdate(description="Nova descricao")
        )

    assert called == [("yt-2", "Titulo.", "Nova descricao")]


async def test_save_draft_skips_sync_when_fields_unchanged(clip_repo, upload_repo):
    clip = _make_clip(selected_title="Mesmo", description="Descricao.")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id="yt-3")

    called: list[tuple] = []

    def fake_snippet(*args):
        called.append(args)

    with patch(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        fake_snippet,
    ):
        service = SaveClipDraftService(clip_repo, upload_repo)
        await service.execute(clip.id, ClipDraftUpdate(selected_title="Mesmo"))

    assert called == []


async def test_save_draft_skips_sync_when_only_whatsapp_changed(clip_repo, upload_repo):
    clip = _make_clip(
        selected_title="Titulo.",
        description="Descricao.",
        whatsapp_message="Antiga",
    )
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id="yt-4")

    called: list[tuple] = []

    def fake_snippet(*args):
        called.append(args)

    with patch(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        fake_snippet,
    ):
        service = SaveClipDraftService(clip_repo, upload_repo)
        await service.execute(
            clip.id, ClipDraftUpdate(whatsapp_message="Nova mensagem WA")
        )

    assert called == []


async def test_save_draft_skips_sync_when_no_youtube_video_id(clip_repo, upload_repo):
    clip = _make_clip(selected_title="Antigo", description="Descricao.")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id=None)

    called: list[tuple] = []

    def fake_snippet(*args):
        called.append(args)

    with patch(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        fake_snippet,
    ):
        service = SaveClipDraftService(clip_repo, upload_repo)
        await service.execute(clip.id, ClipDraftUpdate(selected_title="Novo"))

    assert called == []


async def test_save_draft_skips_sync_when_no_upload(clip_repo, upload_repo):
    clip = _make_clip(selected_title="Antigo", description="Descricao.")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = None

    called: list[tuple] = []

    def fake_snippet(*args):
        called.append(args)

    with patch(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        fake_snippet,
    ):
        service = SaveClipDraftService(clip_repo, upload_repo)
        await service.execute(clip.id, ClipDraftUpdate(selected_title="Novo"))

    assert called == []


async def test_save_draft_does_not_break_when_youtube_sync_fails(clip_repo, upload_repo):
    from googleapiclient.errors import HttpError

    clip = _make_clip(selected_title="Antigo", description="Descricao.")
    clip_repo.get_by_id.return_value = clip
    clip_repo.update.side_effect = lambda c: c
    upload_repo.get_by_clip_id.return_value = _make_upload(youtube_video_id="yt-5")

    class _Resp:
        status = 500
        reason = "Internal"

    def failing_snippet(*args):
        raise HttpError(resp=_Resp(), content=b'{"error":{"message":"boom"}}')

    with patch(
        "app.modules.clips.services.save_clip_draft_service.update_youtube_video_snippet",
        failing_snippet,
    ):
        service = SaveClipDraftService(clip_repo, upload_repo)
        updated = await service.execute(
            clip.id, ClipDraftUpdate(selected_title="Novo titulo")
        )

    assert updated.selected_title == "Novo titulo"
