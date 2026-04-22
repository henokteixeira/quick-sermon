import json
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import structlog
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from sqlalchemy import create_engine, select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import Session
from temporalio import activity

from app.core.config import settings
from app.modules.clips.enums import ClipStatus
from app.modules.clips.models import Clip
from app.modules.youtube.enums import YouTubeUploadErrorCode, YouTubeUploadStatus
from app.modules.youtube.models import YouTubeConnection, YouTubeUpload
from app.modules.youtube.services.get_quota_service import UPLOAD_COST
from app.modules.youtube.services.token_encryption_service import decrypt_token

logger = structlog.get_logger()

CHUNK_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

# Sync engine for sync activities (runs in ThreadPoolExecutor)
_sync_db_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
_sync_engine = create_engine(_sync_db_url, pool_size=5, max_overflow=2)


def _report_progress(
    clip_id: str, stage: str, percent: float, speed: str | None,
    started_at: float | None = None,
) -> None:
    data = {"stage": stage, "percent": percent, "speed": speed, "started_at": started_at}
    activity.heartbeat(data)
    progress_file = Path(settings.CLIPS_BASE_DIR) / clip_id / "progress.json"
    progress_file.parent.mkdir(parents=True, exist_ok=True)
    progress_file.write_text(json.dumps(data))


@dataclass
class UploadInput:
    upload_id: str
    clip_id: str
    file_path: str
    title: str
    description: str


@dataclass
class UploadResult:
    youtube_video_id: str
    youtube_url: str


def _get_credentials(connection: dict) -> Credentials:
    return Credentials(
        token=decrypt_token(connection["access_token"]),
        refresh_token=decrypt_token(connection["refresh_token"]),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.YOUTUBE_CLIENT_ID,
        client_secret=settings.YOUTUBE_CLIENT_SECRET,
    )


def _fetch_connection_sync() -> dict | None:
    with Session(_sync_engine) as session:
        result = session.execute(
            select(
                YouTubeConnection.access_token,
                YouTubeConnection.refresh_token,
            )
            .order_by(YouTubeConnection.created_at.desc())
            .limit(1)
        )
        row = result.first()
        if not row:
            return None
        return {"access_token": row[0], "refresh_token": row[1]}


@activity.defn
def upload_to_youtube(input: UploadInput) -> UploadResult:
    connection_data = _fetch_connection_sync()

    if not connection_data:
        raise RuntimeError("No YouTube connection configured")

    file_path = Path(input.file_path)
    if not file_path.exists():
        raise RuntimeError(f"Clip file not found: {input.file_path}")

    credentials = _get_credentials(connection_data)

    youtube = build("youtube", "v3", credentials=credentials)

    body = {
        "snippet": {
            "title": input.title,
            "description": input.description,
            "categoryId": "22",  # People & Blogs
        },
        "status": {
            "privacyStatus": "unlisted",
        },
    }

    media = MediaFileUpload(
        str(file_path),
        mimetype="video/mp4",
        chunksize=CHUNK_SIZE_BYTES,
        resumable=True,
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    upload_started_at = time.time()
    _report_progress(input.clip_id, "uploading", 0.0, None, upload_started_at)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            percent = round(status.progress() * 100, 1)
            _report_progress(input.clip_id, "uploading", percent, None, upload_started_at)

    video_id = response["id"]
    youtube_url = f"https://www.youtube.com/watch?v={video_id}"

    _report_progress(input.clip_id, "uploading", 100.0, None, upload_started_at)

    logger.info(
        "youtube_upload_complete",
        video_id=video_id,
        url=youtube_url,
    )

    return UploadResult(youtube_video_id=video_id, youtube_url=youtube_url)


@dataclass
class UploadStatusInput:
    upload_id: str
    clip_id: str
    youtube_video_id: str | None = None
    youtube_url: str | None = None
    status: str = YouTubeUploadStatus.COMPLETED
    error_code: str | None = None
    error_message: str | None = None
    clip_status: str = ClipStatus.AWAITING_REVIEW


@activity.defn
def update_upload_status(input: UploadStatusInput) -> None:
    upload_values: dict = {"youtube_status": input.status}
    if input.youtube_video_id:
        upload_values["youtube_video_id"] = input.youtube_video_id
    if input.youtube_url:
        upload_values["youtube_url"] = input.youtube_url
    if input.error_code:
        upload_values["error_code"] = input.error_code
    if input.error_message:
        upload_values["error_message"] = input.error_message

    clip_values: dict = {"status": input.clip_status}
    if input.clip_status == ClipStatus.AWAITING_REVIEW:
        clip_values["uploaded_at"] = datetime.now(timezone.utc)

    with Session(_sync_engine) as session:
        session.execute(
            update(YouTubeUpload)
            .where(YouTubeUpload.id == uuid.UUID(input.upload_id))
            .values(**upload_values)
        )
        session.execute(
            update(Clip)
            .where(Clip.id == uuid.UUID(input.clip_id))
            .values(**clip_values)
        )
        session.commit()


@activity.defn
def increment_quota() -> None:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    with _sync_engine.connect() as conn:
        # Get the latest connection's current quota
        row = conn.execute(
            select(
                YouTubeConnection.id,
                YouTubeConnection.daily_quota_used,
                YouTubeConnection.quota_reset_date,
            )
            .order_by(YouTubeConnection.created_at.desc())
            .limit(1)
        ).first()
        if not row:
            return

        conn_id, current_used, reset_date = row
        if reset_date != today:
            new_used = UPLOAD_COST
        else:
            new_used = current_used + UPLOAD_COST

        conn.execute(
            update(YouTubeConnection)
            .where(YouTubeConnection.id == conn_id)
            .values(daily_quota_used=new_used, quota_reset_date=today)
        )
        conn.commit()


def update_youtube_privacy(video_id: str, privacy_status: str) -> None:
    """Synchronous helper — update the privacy status of a YouTube video.

    Called from services via ``asyncio.to_thread``. Raises whatever the
    googleapiclient raises (HttpError subclasses) so services can map to
    domain exceptions.
    """
    connection_data = _fetch_connection_sync()
    if not connection_data:
        raise RuntimeError("No YouTube connection configured")

    credentials = _get_credentials(connection_data)
    youtube = build("youtube", "v3", credentials=credentials)
    youtube.videos().update(
        part="status",
        body={"id": video_id, "status": {"privacyStatus": privacy_status}},
    ).execute()


def update_youtube_video_snippet(
    video_id: str, title: str, description: str
) -> None:
    """Synchronous helper — update the snippet (title/description) of a YouTube video."""
    connection_data = _fetch_connection_sync()
    if not connection_data:
        raise RuntimeError("No YouTube connection configured")

    credentials = _get_credentials(connection_data)
    youtube = build("youtube", "v3", credentials=credentials)
    youtube.videos().update(
        part="snippet",
        body={
            "id": video_id,
            "snippet": {
                "title": title,
                "description": description,
                "categoryId": "22",
            },
        },
    ).execute()


def delete_youtube_video(video_id: str) -> None:
    """Synchronous helper — delete a video from YouTube."""
    connection_data = _fetch_connection_sync()
    if not connection_data:
        raise RuntimeError("No YouTube connection configured")

    credentials = _get_credentials(connection_data)
    youtube = build("youtube", "v3", credentials=credentials)
    youtube.videos().delete(id=video_id).execute()
