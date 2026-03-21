from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.videos.repositories.video_repository import VideoRepository


def get_video_repository(db: AsyncSession = Depends(get_db)) -> VideoRepository:
    return VideoRepository(db)
