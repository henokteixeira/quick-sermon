"""Run sermon detection across the reference dataset and compare against ground truth.

Usage (inside the backend container):
    python scripts/test_detection_dataset.py
"""
import asyncio
import json
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.core.temporal_client import get_temporal_client
from app.modules.users.models import User  # noqa: F401  registers users table for FK resolution
from app.modules.videos.enums import DetectionStatus, VideoStatus
from app.modules.videos.models import Video, VideoDetection
from app.modules.videos.services.fetch_metadata_service import FetchMetadataService

FIXTURE = Path(__file__).resolve().parent.parent / (
    "app/modules/videos/tests/fixtures/reference_videos.json"
)
TOLERANCE_SECONDS = 120
POLL_INTERVAL_SECONDS = 5
MAX_WAIT_SECONDS = 25 * 60


def fmt_time(s: int | None) -> str:
    if s is None:
        return "  --:--:--"
    h = s // 3600
    m = (s % 3600) // 60
    sec = s % 60
    return f"{h:02d}:{m:02d}:{sec:02d}"


async def get_or_create_video(session: AsyncSession, entry: dict) -> Video:
    result = await session.execute(
        select(Video).where(Video.source_url == entry["source_url"])
    )
    video = result.scalar_one_or_none()
    if video is not None:
        return video
    print(f"    fetching metadata for {entry['source_url']}...", flush=True)
    metadata_service = FetchMetadataService()
    metadata = await metadata_service.execute(entry["source_url"])
    video = Video(
        source_url=entry["source_url"],
        title=metadata.title,
        duration=metadata.duration,
        thumbnail_url=metadata.thumbnail_url,
        youtube_video_id=metadata.video_id,
        channel_name=metadata.channel_name,
        view_count=metadata.view_count,
        upload_date=metadata.upload_date,
        status=VideoStatus.PENDING,
        submitted_by=None,
    )
    session.add(video)
    await session.flush()
    return video


async def trigger_detection(
    session: AsyncSession, video_id: uuid.UUID, source_url: str, temporal_client
) -> uuid.UUID:
    detection = VideoDetection(video_id=video_id, status=DetectionStatus.RUNNING)
    session.add(detection)
    await session.flush()
    detection_id = detection.id
    workflow_id = f"detect-{detection_id}"
    detection.temporal_workflow_id = workflow_id
    await session.commit()

    await temporal_client.start_workflow(
        "DetectSermonTimestampsWorkflow",
        {
            "video_id": str(video_id),
            "source_url": source_url,
            "detection_id": str(detection_id),
        },
        id=workflow_id,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        execution_timeout=timedelta(minutes=settings.DETECTION_WORKFLOW_TIMEOUT_MINUTES),
    )
    return detection_id


async def wait_for_completion(
    engine, detection_id: uuid.UUID
) -> dict:
    deadline = datetime.now() + timedelta(seconds=MAX_WAIT_SECONDS)
    while datetime.now() < deadline:
        async with AsyncSession(engine) as poll_session:
            result = await poll_session.execute(
                select(VideoDetection).where(VideoDetection.id == detection_id)
            )
            detection = result.scalar_one_or_none()
            if detection and detection.status != DetectionStatus.RUNNING:
                return {
                    "status": detection.status,
                    "method": detection.method,
                    "start_seconds": detection.start_seconds,
                    "end_seconds": detection.end_seconds,
                    "confidence": detection.confidence,
                    "error_message": detection.error_message,
                }
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
    raise TimeoutError(f"Detection {detection_id} did not complete in time")


async def process_entry(
    entry: dict, engine, temporal_client
) -> dict:
    async with AsyncSession(engine) as session:
        video = await get_or_create_video(session, entry)
        await session.flush()
        video_id = video.id
        source_url = video.source_url
        detection_id = await trigger_detection(
            session, video_id, source_url, temporal_client
        )
    final = await wait_for_completion(engine, detection_id)

    diff_start = (
        abs(final["start_seconds"] - entry["true_start"])
        if final["start_seconds"] is not None
        else None
    )
    diff_end = (
        abs(final["end_seconds"] - entry["true_end"])
        if final["end_seconds"] is not None
        else None
    )
    hit = (
        diff_start is not None
        and diff_end is not None
        and diff_start <= TOLERANCE_SECONDS
        and diff_end <= TOLERANCE_SECONDS
    )
    return {
        "label": entry["label"],
        "youtube_id": entry["youtube_id"],
        "true_start": entry["true_start"],
        "true_end": entry["true_end"],
        "detected_start": final["start_seconds"],
        "detected_end": final["end_seconds"],
        "diff_start": diff_start,
        "diff_end": diff_end,
        "confidence": final["confidence"],
        "method": final["method"],
        "status": final["status"],
        "hit": hit,
        "error": final["error_message"],
    }


def render_markdown(results: list[dict]) -> str:
    lines = [
        "| # | Label | GT start | GT end | Det start | Det end | Δstart | Δend | Conf | Method | Hit (±2min) |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for i, r in enumerate(results, 1):
        lines.append(
            f"| {i} | {r['label']} | {fmt_time(r['true_start'])} | {fmt_time(r['true_end'])} | "
            f"{fmt_time(r['detected_start'])} | {fmt_time(r['detected_end'])} | "
            f"{r['diff_start'] if r['diff_start'] is not None else '--'}s | "
            f"{r['diff_end'] if r['diff_end'] is not None else '--'}s | "
            f"{r['confidence'] or '--'} | {r['method'] or '--'} | "
            f"{'YES' if r['hit'] else 'NO'} |"
        )
    hits = sum(1 for r in results if r["hit"])
    lines.append("")
    lines.append(f"**Hits: {hits}/{len(results)}** (target ≥9/10)")
    return "\n".join(lines)


async def main() -> int:
    entries = json.loads(FIXTURE.read_text())
    only_id = sys.argv[1] if len(sys.argv) > 1 else None
    if only_id:
        entries = [e for e in entries if e["youtube_id"] == only_id]
        if not entries:
            print(f"No fixture entry with youtube_id={only_id}")
            return 1

    engine = create_async_engine(settings.DATABASE_URL)
    temporal_client = await get_temporal_client()

    results: list[dict] = []
    for entry in entries:
        print(f"--> {entry['label']} ({entry['youtube_id']}) ...", flush=True)
        try:
            result = await process_entry(entry, engine, temporal_client)
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print(f"    EXCEPTION: {tb}", flush=True)
            result = {
                    "label": entry["label"],
                    "youtube_id": entry["youtube_id"],
                    "true_start": entry["true_start"],
                    "true_end": entry["true_end"],
                    "detected_start": None,
                    "detected_end": None,
                    "diff_start": None,
                    "diff_end": None,
                    "confidence": None,
                    "method": None,
                    "status": "exception",
                    "hit": False,
                    "error": str(e)[:500],
                }
        results.append(result)
        last = results[-1]
        print(
            f"    {last['status']} | method={last['method']} conf={last['confidence']} "
            f"Δstart={last['diff_start']}s Δend={last['diff_end']}s hit={last['hit']}",
            flush=True,
        )

    print()
    print(render_markdown(results))
    await engine.dispose()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
