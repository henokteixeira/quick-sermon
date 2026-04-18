import uuid
from datetime import timedelta

from google_auth_oauthlib.flow import Flow

from app.core.config import settings
from app.core.security import create_access_token

SCOPES = [
    "https://www.googleapis.com/auth/youtube.force-ssl",
]


class GetOAuthUrlService:
    def __init__(self, redirect_uri: str):
        self.redirect_uri = redirect_uri

    def execute(self, user_id: uuid.UUID) -> str:
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
            redirect_uri=self.redirect_uri,
        )

        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            prompt="consent",
        )

        code_verifier = flow.code_verifier

        state_token = create_access_token(
            {
                "sub": str(user_id),
                "purpose": "youtube_oauth",
                "cv": code_verifier,
            },
            expires_delta=timedelta(minutes=10),
        )

        # Replace the state param in the URL with our JWT that includes the code_verifier
        from urllib.parse import urlencode, urlparse, parse_qs

        parsed = urlparse(authorization_url)
        params = parse_qs(parsed.query, keep_blank_values=True)
        params["state"] = [state_token]
        new_query = urlencode({k: v[0] for k, v in params.items()})
        authorization_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{new_query}"

        return authorization_url
