import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from app.core.config import settings
from app.modules.clips.enums import ClipErrorCode, ClipStatus
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.youtube.enums import YouTubeUploadStatus
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)


@dataclass
class PipelineStage:
    status: str  # "pending" | "running" | "completed" | "error"
    percent: float | None
    speed: str | None
    completed_at: datetime | None
    error_code: str | None
    error_message: str | None


@dataclass
class ClipPipeline:
    download: PipelineStage
    trim: PipelineStage
    upload: PipelineStage


def _empty(status: str = "pending") -> PipelineStage:
    return PipelineStage(
        status=status,
        percent=None,
        speed=None,
        completed_at=None,
        error_code=None,
        error_message=None,
    )


class GetClipPipelineService:
    def __init__(
        self,
        clip_repo: ClipRepository,
        upload_repo: YouTubeUploadRepository,
    ):
        self.clip_repo = clip_repo
        self.upload_repo = upload_repo

    async def execute(self, clip_id: uuid.UUID) -> ClipPipeline:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        progress = self._read_progress_file(clip.id)

        download = self._stage_download(clip, progress)
        trim = self._stage_trim(clip, progress)
        upload = await self._stage_upload(clip_id, clip, progress)

        return ClipPipeline(download=download, trim=trim, upload=upload)

    @staticmethod
    def _read_progress_file(clip_id: uuid.UUID) -> dict:
        progress_file = Path(settings.CLIPS_BASE_DIR) / str(clip_id) / "progress.json"
        try:
            return json.loads(progress_file.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _stage_download(self, clip, progress: dict) -> PipelineStage:
        if clip.downloaded_at:
            return PipelineStage(
                status="completed",
                percent=100.0,
                speed=None,
                completed_at=clip.downloaded_at,
                error_code=None,
                error_message=None,
            )

        if clip.status == ClipStatus.DOWNLOADING:
            stage_progress = (
                progress if progress.get("stage") == "downloading" else {}
            )
            return PipelineStage(
                status="running",
                percent=stage_progress.get("percent"),
                speed=stage_progress.get("speed"),
                completed_at=None,
                error_code=None,
                error_message=None,
            )

        if clip.status == ClipStatus.ERROR and clip.error_code in (
            ClipErrorCode.DOWNLOAD_FAILED,
            ClipErrorCode.DOWNLOAD_TIMEOUT,
            ClipErrorCode.VIDEO_UNAVAILABLE,
        ):
            return PipelineStage(
                status="error",
                percent=None,
                speed=None,
                completed_at=None,
                error_code=clip.error_code,
                error_message=clip.error_message,
            )

        return _empty("pending")

    def _stage_trim(self, clip, progress: dict) -> PipelineStage:
        if clip.trimmed_at:
            return PipelineStage(
                status="completed",
                percent=100.0,
                speed=None,
                completed_at=clip.trimmed_at,
                error_code=None,
                error_message=None,
            )

        if clip.status == ClipStatus.TRIMMING:
            stage_progress = progress if progress.get("stage") == "trimming" else {}
            return PipelineStage(
                status="running",
                percent=stage_progress.get("percent"),
                speed=stage_progress.get("speed"),
                completed_at=None,
                error_code=None,
                error_message=None,
            )

        if clip.status == ClipStatus.ERROR and clip.error_code in (
            ClipErrorCode.TRIM_FAILED,
            ClipErrorCode.TRIM_CORRUPTED,
        ):
            return PipelineStage(
                status="error",
                percent=None,
                speed=None,
                completed_at=None,
                error_code=clip.error_code,
                error_message=clip.error_message,
            )

        return _empty("pending")

    async def _stage_upload(
        self, clip_id: uuid.UUID, clip, progress: dict
    ) -> PipelineStage:
        if clip.uploaded_at:
            return PipelineStage(
                status="completed",
                percent=100.0,
                speed=None,
                completed_at=clip.uploaded_at,
                error_code=None,
                error_message=None,
            )

        if clip.status == ClipStatus.UPLOADING:
            stage_progress = progress if progress.get("stage") == "uploading" else {}
            return PipelineStage(
                status="running",
                percent=stage_progress.get("percent"),
                speed=stage_progress.get("speed"),
                completed_at=None,
                error_code=None,
                error_message=None,
            )

        upload = await self.upload_repo.get_by_clip_id(clip_id)
        if upload and upload.youtube_status == YouTubeUploadStatus.FAILED:
            return PipelineStage(
                status="error",
                percent=None,
                speed=None,
                completed_at=None,
                error_code=upload.error_code,
                error_message=upload.error_message,
            )

        return _empty("pending")
