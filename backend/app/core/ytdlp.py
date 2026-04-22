import asyncio
import os
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class YtDlpResult:
    returncode: int
    stdout: bytes
    stderr: str
    timed_out: bool = False
    not_found: bool = False

    @property
    def ok(self) -> bool:
        return (
            self.returncode == 0
            and not self.timed_out
            and not self.not_found
        )


def build_auth_args() -> list[str]:
    path = settings.YTDLP_COOKIES_FILE
    if path and os.path.isfile(path) and os.path.getsize(path) > 0:
        return ["--cookies", path]
    return []


def is_rate_limit_error(stderr: str) -> bool:
    return "HTTP Error 429" in stderr or "Too Many Requests" in stderr


def is_bot_check_error(stderr: str) -> bool:
    return (
        "Sign in to confirm you" in stderr
        or "confirm your age" in stderr
        or "cookies-from-browser" in stderr
    )


async def run_yt_dlp(
    args: list[str], *, timeout: float | None = None
) -> YtDlpResult:
    cmd = ["yt-dlp", *args, *build_auth_args()]
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        if timeout is not None:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=timeout
            )
        else:
            stdout, stderr = await process.communicate()
    except asyncio.TimeoutError:
        return YtDlpResult(
            returncode=-1, stdout=b"", stderr="", timed_out=True
        )
    except FileNotFoundError:
        return YtDlpResult(
            returncode=-1, stdout=b"", stderr="", not_found=True
        )

    return YtDlpResult(
        returncode=process.returncode or 0,
        stdout=stdout,
        stderr=stderr.decode().strip() if stderr else "",
    )
