import json
import queue
import re
import subprocess
import threading
import time
from dataclasses import dataclass
from pathlib import Path

import structlog
from temporalio import activity

from app.core.config import settings
from app.core.ytdlp import build_auth_args
from app.modules.clips.services.update_clip_status_service import update_clip_status

logger = structlog.get_logger()

def _report_progress(
    clip_id: str, stage: str, percent: float, speed: str | None,
    started_at: float | None = None,
) -> None:
    data = {
        "stage": stage,
        "percent": percent,
        "speed": speed,
        "started_at": started_at,
    }
    activity.heartbeat(data)
    progress_file = Path(settings.CLIPS_BASE_DIR) / clip_id / "progress.json"
    progress_file.write_text(json.dumps(data))


@dataclass
class StatusUpdateInput:
    clip_id: str
    status: str
    error_code: str | None = None
    error_message: str | None = None
    file_path: str | None = None
    file_size: int | None = None
    duration: int | None = None
    resolution: str | None = None
    mark_downloaded: bool = False
    mark_trimmed: bool = False


@activity.defn
async def update_clip_status_activity(input: StatusUpdateInput) -> None:
    await update_clip_status(
        clip_id=input.clip_id,
        status=input.status,
        error_code=input.error_code,
        error_message=input.error_message,
        file_path=input.file_path,
        file_size=input.file_size,
        duration=input.duration,
        resolution=input.resolution,
        mark_downloaded=input.mark_downloaded,
        mark_trimmed=input.mark_trimmed,
    )


@dataclass
class DownloadInput:
    clip_id: str
    source_url: str
    start_time: int
    end_time: int
    quality: str
    format_id: str | None = None


@dataclass
class DownloadResult:
    file_path: str
    actual_start: float
    file_size: int


@dataclass
class TrimInput:
    clip_id: str
    raw_file_path: str
    actual_start: float
    target_start: int
    target_end: int


@dataclass
class TrimResult:
    file_path: str
    file_size: int
    duration: int
    resolution: str


def _build_format_string(quality: str) -> str:
    height = re.sub(r"[^\d]", "", quality)
    if not height:
        return "bestvideo+bestaudio/best"
    h = int(height)
    return (
        f"bestvideo[height>={h}]+bestaudio/best[height>={h}]/"
        f"bestvideo+bestaudio/best"
    )


@activity.defn
def download_video_segment(input: DownloadInput) -> DownloadResult:
    clip_dir = Path(settings.CLIPS_BASE_DIR) / input.clip_id
    clip_dir.mkdir(parents=True, exist_ok=True)
    raw_path = clip_dir / "raw.mp4"

    format_str = input.format_id or _build_format_string(input.quality)

    cmd = [
        "yt-dlp",
        "--downloader", "native",
        "-N", "8",
        "--concurrent-fragments", "8",
        "--retries", "10",
        "--fragment-retries", "10",
        "-4",
        "-f", format_str,
        "--merge-output-format", "mp4",
        "-o", str(raw_path),
        "--no-playlist",
        "--newline",
        *build_auth_args(),
        input.source_url,
    ]

    if not input.format_id:
        cmd.insert(1, "node")
        cmd.insert(1, "--js-runtimes")

    logger.info("starting_download", cmd=" ".join(cmd))
    download_started_at = time.time()
    _report_progress(input.clip_id, "downloading", 0.0, None, download_started_at)

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    line_queue: queue.Queue[str | None] = queue.Queue()

    def reader():
        for line in iter(process.stdout.readline, ""):
            line_queue.put(line)
        line_queue.put(None)

    reader_thread = threading.Thread(target=reader, daemon=True)
    reader_thread.start()

    last_percent = 0.0
    last_speed: str | None = None

    while True:
        try:
            line = line_queue.get(timeout=10)
        except queue.Empty:
            _report_progress(input.clip_id, "downloading", last_percent, last_speed, download_started_at)
            continue

        if line is None:
            break

        line = line.strip()
        if not line:
            continue

        updated = False

        # Native downloader: [download]  45.2% of ~500MiB at 12.5MiB/s
        dl_match = re.search(r"\[download\]\s+([\d.]+)%", line)
        dl_speed_match = re.search(r"at\s+([\d.]+\S+/s)", line)
        if dl_match:
            last_percent = min(99.0, float(dl_match.group(1)))
            updated = True
        if dl_speed_match:
            last_speed = dl_speed_match.group(1)
            updated = True

        if updated:
            _report_progress(input.clip_id, "downloading", last_percent, last_speed, download_started_at)

    process.wait()

    if process.returncode != 0:
        raise RuntimeError(f"yt-dlp failed with return code {process.returncode}")

    if not raw_path.exists():
        raise RuntimeError("Downloaded file not found after yt-dlp completed")

    file_size = raw_path.stat().st_size

    logger.info(
        "download_complete",
        file_size=file_size,
    )

    return DownloadResult(
        file_path=str(raw_path),
        actual_start=0.0,
        file_size=file_size,
    )


@activity.defn
def trim_video(input: TrimInput) -> TrimResult:
    clip_dir = Path(settings.CLIPS_BASE_DIR) / input.clip_id
    final_path = clip_dir / "final.mp4"

    trim_start = input.target_start - input.actual_start
    trim_end = input.target_end - input.actual_start
    duration = trim_end - trim_start

    if trim_start < 0:
        trim_start = 0
        duration = trim_end

    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(trim_start),
        "-i", input.raw_file_path,
        "-t", str(duration),
        "-c", "copy",
        "-movflags", "+faststart",
        "-avoid_negative_ts", "make_zero",
        str(final_path),
    ]

    logger.info("starting_trim", ss=trim_start, to=trim_end)
    _report_progress(input.clip_id, "trimming", 0.0, None)

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg trim failed: {result.stderr[:500]}")

    if not final_path.exists():
        raise RuntimeError("Trimmed file not found after FFmpeg completed")

    _report_progress(input.clip_id, "trimming", 100.0, None)

    probe = _probe_file(str(final_path))

    raw_path = Path(input.raw_file_path)
    if raw_path.exists():
        raw_path.unlink()

    return TrimResult(
        file_path=str(final_path),
        file_size=final_path.stat().st_size,
        duration=int(float(probe.get("duration", 0))),
        resolution=probe.get("resolution", "unknown"),
    )


def _probe_start_time(file_path: str) -> float:
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-show_entries", "format=start_time",
        "-of", "json",
        file_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return 0.0
    data = json.loads(result.stdout)
    return float(data.get("format", {}).get("start_time", 0.0))


def _probe_file(file_path: str) -> dict:
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-show_entries", "format=duration:stream=width,height",
        "-of", "json",
        file_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return {}
    data = json.loads(result.stdout)

    duration = data.get("format", {}).get("duration", "0")

    streams = data.get("streams", [])
    resolution = "unknown"
    for stream in streams:
        if "height" in stream and "width" in stream:
            resolution = f"{stream['width']}x{stream['height']}"
            break

    return {"duration": duration, "resolution": resolution}
