import uuid

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy import update

from app.core.config import settings
from app.modules.clips.models import Clip

_engine: AsyncEngine | None = None


def _get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(settings.DATABASE_URL, pool_size=5, max_overflow=2)
    return _engine


async def update_clip_status(
    clip_id: str,
    status: str,
    error_code: str | None = None,
    error_message: str | None = None,
    file_path: str | None = None,
    file_size: int | None = None,
    duration: int | None = None,
    resolution: str | None = None,
) -> None:
    engine = _get_engine()
    async with AsyncSession(engine) as session:
        values: dict = {"status": status}
        if error_code is not None:
            values["error_code"] = error_code
        if error_message is not None:
            values["error_message"] = error_message
        if file_path is not None:
            values["file_path"] = file_path
        if file_size is not None:
            values["file_size"] = file_size
        if duration is not None:
            values["duration"] = duration
        if resolution is not None:
            values["resolution"] = resolution

        await session.execute(
            update(Clip).where(Clip.id == uuid.UUID(clip_id)).values(**values)
        )
        await session.commit()
