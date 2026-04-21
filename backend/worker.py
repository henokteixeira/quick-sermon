import asyncio
import signal
from concurrent.futures import ThreadPoolExecutor

import structlog
from temporalio.client import Client
from temporalio.worker import Worker

from app.core.config import settings
from app.core.logging import setup_logging
from app.modules.clips.activities import (
    download_video_segment,
    trim_video,
    update_clip_status_activity,
)
from app.modules.clips.workflows import DownloadAndTrimWorkflow
from app.modules.videos.activities import (
    detect_chapters_activity,
    fetch_captions_activity,
    persist_detection_result_activity,
)
from app.modules.videos.workflows import DetectSermonTimestampsWorkflow
from app.modules.youtube.activities import (
    increment_quota,
    update_upload_status,
    upload_to_youtube,
)
from app.modules.youtube.workflows import UploadToYouTubeWorkflow

logger = structlog.get_logger()

shutdown_event = asyncio.Event()


def handle_signal(sig: signal.Signals) -> None:
    logger.info("received_shutdown_signal", signal=sig.name)
    shutdown_event.set()


async def main() -> None:
    setup_logging(debug=settings.DEBUG)

    client = await Client.connect(
        settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE,
    )

    workflows = [
        DownloadAndTrimWorkflow,
        UploadToYouTubeWorkflow,
        DetectSermonTimestampsWorkflow,
    ]
    activities = [
        download_video_segment,
        trim_video,
        update_clip_status_activity,
        upload_to_youtube,
        update_upload_status,
        increment_quota,
        detect_chapters_activity,
        fetch_captions_activity,
        persist_detection_result_activity,
    ]

    worker = Worker(
        client,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        workflows=workflows,
        activities=activities,
        activity_executor=ThreadPoolExecutor(max_workers=4),
    )

    logger.info(
        "starting_worker",
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        host=settings.TEMPORAL_HOST,
    )

    async with worker:
        await shutdown_event.wait()

    logger.info("worker_stopped")


if __name__ == "__main__":
    loop = asyncio.new_event_loop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, handle_signal, sig)

    try:
        loop.run_until_complete(main())
    finally:
        loop.close()
