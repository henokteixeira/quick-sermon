from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.repositories.youtube_upload_repository import (
    YouTubeUploadRepository,
)


def get_youtube_connection_repository(
    db: AsyncSession = Depends(get_db),
) -> YouTubeConnectionRepository:
    return YouTubeConnectionRepository(db)


def get_youtube_upload_repository(
    db: AsyncSession = Depends(get_db),
) -> YouTubeUploadRepository:
    return YouTubeUploadRepository(db)
