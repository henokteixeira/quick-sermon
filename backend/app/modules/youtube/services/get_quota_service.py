from datetime import datetime, timezone

from app.modules.youtube.exceptions import YouTubeConnectionNotFoundException
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.schemas import QuotaResponse

DAILY_LIMIT = 10000
UPLOAD_COST = 1600
WARNING_THRESHOLD = 0.80


class GetQuotaService:
    def __init__(self, connection_repo: YouTubeConnectionRepository):
        self.connection_repo = connection_repo

    async def execute(self) -> QuotaResponse:
        connection = await self.connection_repo.get_active()
        if not connection:
            raise YouTubeConnectionNotFoundException()

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        used = connection.daily_quota_used if connection.quota_reset_date == today else 0

        remaining = max(0, DAILY_LIMIT - used)
        percent_used = round((used / DAILY_LIMIT) * 100, 1) if DAILY_LIMIT > 0 else 0

        return QuotaResponse(
            daily_limit=DAILY_LIMIT,
            used=used,
            remaining=remaining,
            percent_used=percent_used,
            warning=percent_used >= WARNING_THRESHOLD * 100,
            blocked=remaining < UPLOAD_COST,
        )
