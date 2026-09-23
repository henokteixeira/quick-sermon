from datetime import datetime, timezone

from sqlalchemy import select

from app.modules.clips.enums import ClipStatus
from app.modules.clips.models import Clip
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from app.modules.videos.models import Video
from app.modules.videos.repositories.video_repository import VideoRepository
from app.modules.youtube.models import YouTubeConnection, YouTubeUpload
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)
from app.modules.youtube.services.trigger_upload_service import TriggerUploadService


class _TemporalQueRegistraOsWorkflows:
    def __init__(self):
        self.iniciados = []

    async def start_workflow(self, workflow, arg, *, id, task_queue):
        self.iniciados.append(id)


async def test_upload_de_clip_pronto_cria_o_registro_e_inicia_o_workflow(db_session):
    editor = User(
        email="editor@igreja.test", name="Editor", password_hash="x", role=UserRole.EDITOR
    )
    db_session.add(editor)
    await db_session.flush()
    db_session.add(
        YouTubeConnection(
            access_token="enc-access",
            refresh_token="enc-refresh",
            channel_id="UC1",
            channel_title="Canal Teste",
            daily_quota_used=9000,
            quota_reset_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            connected_by=editor.id,
        )
    )
    video = Video(source_url="https://youtube.com/watch?v=live1", title="Culto de Domingo")
    db_session.add(video)
    await db_session.flush()
    clip = Clip(
        video_id=video.id,
        status=ClipStatus.READY,
        start_time=0,
        end_time=60,
        quality="720p",
        file_path="/data/clips/clip.mp4",
    )
    db_session.add(clip)
    await db_session.flush()
    temporal = _TemporalQueRegistraOsWorkflows()
    service = TriggerUploadService(
        YouTubeConnectionRepository(db_session),
        YouTubeUploadRepository(db_session),
        ClipRepository(db_session),
        VideoRepository(db_session),
        temporal,
    )

    await service.execute(clip.id, editor.id)

    uploads = (
        await db_session.execute(select(YouTubeUpload).where(YouTubeUpload.clip_id == clip.id))
    ).scalars().all()
    assert len(uploads) == 1
    assert len(temporal.iniciados) == 1
