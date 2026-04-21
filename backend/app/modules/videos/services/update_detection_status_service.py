import uuid
from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine

from app.core.config import settings
from app.modules.videos.enums import DetectionStatus
from app.modules.videos.models import VideoDetection

_engine: AsyncEngine | None = None


def _get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(settings.DATABASE_URL, pool_size=5, max_overflow=2)
    return _engine


async def update_detection_status(
    detection_id: str,
    status: str,
    method: str | None = None,
    start_seconds: int | None = None,
    end_seconds: int | None = None,
    confidence: int | None = None,
    error_message: str | None = None,
    raw_fase_chapters: dict | None = None,
    raw_fase_captions: dict | None = None,
    raw_fase_vad: dict | None = None,
    raw_fase_llm: dict | None = None,
) -> None:
    engine = _get_engine()
    async with AsyncSession(engine) as session:
        values: dict = {"status": status}
        if method is not None:
            values["method"] = method
        if start_seconds is not None:
            values["start_seconds"] = start_seconds
        if end_seconds is not None:
            values["end_seconds"] = end_seconds
        if confidence is not None:
            values["confidence"] = confidence
        if error_message is not None:
            values["error_message"] = error_message
        if raw_fase_chapters is not None:
            values["raw_fase_chapters"] = raw_fase_chapters
        if raw_fase_captions is not None:
            values["raw_fase_captions"] = raw_fase_captions
        if raw_fase_vad is not None:
            values["raw_fase_vad"] = raw_fase_vad
        if raw_fase_llm is not None:
            values["raw_fase_llm"] = raw_fase_llm
        if status in (DetectionStatus.COMPLETED, DetectionStatus.FAILED, DetectionStatus.SKIPPED):
            values["completed_at"] = datetime.now(timezone.utc)

        await session.execute(
            update(VideoDetection)
            .where(VideoDetection.id == uuid.UUID(detection_id))
            .values(**values)
        )
        await session.commit()
