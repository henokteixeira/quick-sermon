import json
import uuid
from pathlib import Path

from app.core.config import settings
from app.modules.clips.enums import ClipStatus
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.repositories.clip_repository import ClipRepository


class GetClipProgressService:
    def __init__(self, clip_repo: ClipRepository):
        self.clip_repo = clip_repo

    async def execute(self, clip_id: uuid.UUID) -> dict:
        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        base = {
            "clip_id": str(clip_id),
            "status": clip.status,
            "stage": clip.status,
            "percent": 100.0 if clip.status == ClipStatus.READY else 0.0,
            "speed": None,
        }

        if clip.status not in (ClipStatus.DOWNLOADING, ClipStatus.TRIMMING):
            return base

        # Read progress from file written by the activity
        progress_file = Path(settings.CLIPS_BASE_DIR) / str(clip.id) / "progress.json"
        try:
            data = json.loads(progress_file.read_text())
            return {
                "clip_id": str(clip_id),
                "status": clip.status,
                "stage": data.get("stage", clip.status),
                "percent": data.get("percent", 0.0),
                "speed": data.get("speed"),
            }
        except (FileNotFoundError, json.JSONDecodeError):
            return base
