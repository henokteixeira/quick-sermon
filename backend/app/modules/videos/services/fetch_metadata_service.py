import asyncio
import json

import structlog

from app.modules.videos.exceptions import VideoInaccessibleException
from app.modules.videos.schemas import VideoMetadata
from app.modules.videos.services.youtube_utils import extract_video_id

logger = structlog.get_logger()

TIMEOUT_SECONDS = 15


class FetchMetadataService:
    async def execute(self, url: str) -> VideoMetadata:
        try:
            process = await asyncio.create_subprocess_exec(
                "yt-dlp",
                "--js-runtimes", "node",
                "--dump-json",
                "--no-download",
                "--no-playlist",
                url,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            logger.error("yt-dlp timeout", url=url)
            raise VideoInaccessibleException(
                "Tempo esgotado ao buscar informacoes do video. Tente novamente."
            )
        except FileNotFoundError:
            logger.error("yt-dlp not found in PATH")
            raise VideoInaccessibleException(
                "Erro interno: yt-dlp nao encontrado."
            )

        if process.returncode != 0:
            error_msg = stderr.decode().strip() if stderr else "Unknown error"
            logger.warning("yt-dlp failed", url=url, error=error_msg)
            raise VideoInaccessibleException()

        data = json.loads(stdout.decode())

        video_id = extract_video_id(url) or data.get("id", "")
        thumbnail = (
            data.get("thumbnail")
            or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        )

        return VideoMetadata(
            video_id=video_id,
            title=data.get("title", "Sem titulo"),
            duration=int(data.get("duration", 0)),
            thumbnail_url=thumbnail,
            channel_name=data.get("channel") or data.get("uploader"),
            view_count=data.get("view_count"),
            upload_date=data.get("upload_date"),
        )
