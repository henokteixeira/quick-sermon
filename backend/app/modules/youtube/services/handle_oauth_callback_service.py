import uuid
from datetime import datetime, timezone

import structlog
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.core.config import settings
from app.modules.youtube.exceptions import YouTubeAuthFailedException
from app.modules.youtube.models import YouTubeConnection
from app.modules.youtube.repositories.youtube_connection_repository import (
    YouTubeConnectionRepository,
)
from app.modules.youtube.services.token_encryption_service import encrypt_token

logger = structlog.get_logger()

SCOPES = [
    "https://www.googleapis.com/auth/youtube.force-ssl",
]


class HandleOAuthCallbackService:
    def __init__(self, connection_repo: YouTubeConnectionRepository):
        self.connection_repo = connection_repo

    async def execute(
        self,
        code: str,
        redirect_uri: str,
        user_id: uuid.UUID,
        code_verifier: str | None = None,
    ) -> YouTubeConnection:
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": settings.YOUTUBE_CLIENT_ID,
                        "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=SCOPES,
                redirect_uri=redirect_uri,
            )
            flow.code_verifier = code_verifier
            flow.fetch_token(code=code)
        except Exception as e:
            logger.error("oauth_token_exchange_failed", error=str(e))
            raise YouTubeAuthFailedException(f"Falha ao trocar o codigo OAuth: {e}")

        credentials = flow.credentials

        try:
            youtube = build("youtube", "v3", credentials=credentials)
            response = youtube.channels().list(part="snippet", mine=True).execute()
            channels = response.get("items", [])
            if not channels:
                raise YouTubeAuthFailedException("Nenhum canal YouTube encontrado para esta conta.")
            channel = channels[0]
            channel_id = channel["id"]
            channel_title = channel["snippet"]["title"]
        except YouTubeAuthFailedException:
            raise
        except Exception as e:
            logger.error("youtube_channel_fetch_failed", error=str(e))
            raise YouTubeAuthFailedException(f"Falha ao buscar dados do canal: {e}")

        await self.connection_repo.delete_all()

        token_expiry = None
        if credentials.expiry:
            token_expiry = credentials.expiry.replace(tzinfo=timezone.utc)

        connection = YouTubeConnection(
            access_token=encrypt_token(credentials.token),
            refresh_token=encrypt_token(credentials.refresh_token),
            token_expiry=token_expiry,
            channel_id=channel_id,
            channel_title=channel_title,
            daily_quota_used=0,
            connected_by=user_id,
        )
        return await self.connection_repo.create(connection)
