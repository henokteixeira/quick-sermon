from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "Quick Sermon API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/quick_sermon"

    # Temporal
    TEMPORAL_HOST: str = "temporal:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TASK_QUEUE: str = "video-processing"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage
    CLIPS_BASE_DIR: str = "/data/clips"
    VIDEOS_BASE_DIR: str = "/data/videos"

    # OpenAI (reservado para QS-75 — refinamento com IA)
    OPENAI_API_KEY: str = ""

    # Sermon detection (QS-58)
    SERMON_MIN_DURATION: int = 900
    SERMON_MAX_DURATION: int = 4500
    DETECTION_SKIP_MIN_DURATION: int = 300
    DETECTION_WORKFLOW_TIMEOUT_MINUTES: int = 15

    # YouTube
    YOUTUBE_CLIENT_ID: str = ""
    YOUTUBE_CLIENT_SECRET: str = ""
    YOUTUBE_OAUTH_ENCRYPTION_KEY: str = ""

    # yt-dlp authentication (optional cookies.txt to bypass YouTube bot check)
    YTDLP_COOKIES_FILE: str = ""

    # YouTube OAuth redirect (external URL where the backend is reachable)
    YOUTUBE_REDIRECT_BASE_URL: str = "http://localhost"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()
