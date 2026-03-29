import asyncio
import json
import uuid
from collections import defaultdict

import structlog

from app.modules.videos.exceptions import VideoInaccessibleException, VideoNotFoundException
from app.modules.videos.repositories.video_repository import VideoRepository

logger = structlog.get_logger()

TIMEOUT_SECONDS = 15


class FetchFormatsService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(
        self, video_id: uuid.UUID, clip_duration: int | None = None
    ) -> dict:
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundException(str(video_id))

        formats = await self._fetch_formats(video.source_url, clip_duration)
        return {
            "video_id": str(video.id),
            "duration": video.duration,
            "formats": formats,
        }

    async def _fetch_formats(
        self, url: str, clip_duration: int | None = None
    ) -> list[dict]:
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
            logger.error("yt-dlp_formats_timeout", url=url)
            raise VideoInaccessibleException(
                "Tempo esgotado ao buscar formatos do video."
            )
        except FileNotFoundError:
            logger.error("yt-dlp not found in PATH")
            raise VideoInaccessibleException("Erro interno: yt-dlp nao encontrado.")

        if process.returncode != 0:
            error_msg = stderr.decode().strip() if stderr else "Unknown error"
            logger.warning("yt-dlp_formats_failed", url=url, error=error_msg)
            raise VideoInaccessibleException()

        data = json.loads(stdout.decode())
        raw_formats = data.get("formats", [])
        video_duration = data.get("duration", 0)
        duration_for_estimate = clip_duration or video_duration

        by_height: dict[int, dict] = {}

        best_audio_id: str | None = None
        best_audio_tbr: float = 0

        for fmt in raw_formats:
            format_id = fmt.get("format_id", "")
            vcodec = fmt.get("vcodec", "none")
            acodec = fmt.get("acodec", "none")
            height = fmt.get("height")
            tbr = fmt.get("tbr") or 0

            if vcodec == "none" and acodec != "none" and tbr > best_audio_tbr:
                best_audio_id = format_id
                best_audio_tbr = tbr

            if not height or height < 360 or vcodec == "none":
                continue

            if height not in by_height or tbr > by_height[height]["tbr"]:
                by_height[height] = {"format_id": format_id, "tbr": tbr}

        result = []
        for height in sorted(by_height.keys(), reverse=True):
            info = by_height[height]
            tbr = info["tbr"]
            estimated_mb = (tbr * duration_for_estimate / 8 / 1024) if tbr else 0
            label = f"{height}p"
            if height >= 2160:
                label = f"{height}p (4K)"

            format_spec = info["format_id"]
            if best_audio_id:
                format_spec = f"{info['format_id']}+{best_audio_id}"

            result.append({
                "resolution": label,
                "height": height,
                "estimated_size_mb": round(estimated_mb, 1),
                "format_id": format_spec,
            })

        return result
