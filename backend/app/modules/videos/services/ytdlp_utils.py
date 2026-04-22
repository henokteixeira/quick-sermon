import json

import structlog

from app.core.ytdlp import is_bot_check_error, is_rate_limit_error, run_yt_dlp
from app.modules.videos.exceptions import (
    VideoInaccessibleException,
    YouTubeBotCheckException,
    YouTubeRateLimitException,
)

logger = structlog.get_logger()


async def fetch_yt_dlp_json(
    url: str,
    extra_args: list[str] | None = None,
    *,
    timeout: float = 15,
    log_event: str = "yt-dlp_failed",
) -> dict:
    result = await run_yt_dlp(
        [*(extra_args or []), url], timeout=timeout
    )
    if result.timed_out:
        logger.error(f"{log_event}_timeout", url=url)
        raise VideoInaccessibleException(
            "Tempo esgotado ao buscar informacoes do video. Tente novamente."
        )
    if result.not_found:
        logger.error("yt-dlp not found in PATH")
        raise VideoInaccessibleException("Erro interno: yt-dlp nao encontrado.")
    if not result.ok:
        logger.warning(log_event, url=url, error=result.stderr)
        if is_bot_check_error(result.stderr):
            raise YouTubeBotCheckException()
        if is_rate_limit_error(result.stderr):
            raise YouTubeRateLimitException()
        raise VideoInaccessibleException()

    return json.loads(result.stdout.decode())
