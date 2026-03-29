from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.clips.repositories.clip_repository import ClipRepository


def get_clip_repository(db: AsyncSession = Depends(get_db)) -> ClipRepository:
    return ClipRepository(db)
