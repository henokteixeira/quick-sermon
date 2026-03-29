from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.modules.clips.activities import (
        DownloadInput,
        DownloadResult,
        StatusUpdateInput,
        TrimInput,
        TrimResult,
        download_video_segment,
        trim_video,
        update_clip_status_activity,
    )
    from app.modules.clips.enums import ClipErrorCode, ClipStatus

STATUS_TIMEOUT = timedelta(seconds=30)


@workflow.defn
class DownloadAndTrimWorkflow:
    def __init__(self) -> None:
        self._progress: dict = {
            "stage": "pending",
            "percent": 0.0,
            "speed": None,
        }

    @workflow.query
    def get_progress(self) -> dict:
        return self._progress

    async def _update_status(self, clip_id: str, **kwargs) -> None:
        await workflow.execute_activity(
            update_clip_status_activity,
            StatusUpdateInput(clip_id=clip_id, **kwargs),
            start_to_close_timeout=STATUS_TIMEOUT,
        )

    @workflow.run
    async def run(self, params: dict) -> dict:
        clip_id = params["clip_id"]
        source_url = params["source_url"]
        start_time = params["start_time"]
        end_time = params["end_time"]
        quality = params["quality"]
        format_id = params.get("format_id")

        # --- Download ---
        await self._update_status(clip_id, status=ClipStatus.DOWNLOADING)
        self._progress = {"stage": "downloading", "percent": 0.0, "speed": None}

        try:
            download_result: DownloadResult = await workflow.execute_activity(
                download_video_segment,
                DownloadInput(
                    clip_id=clip_id,
                    source_url=source_url,
                    start_time=start_time,
                    end_time=end_time,
                    quality=quality,
                    format_id=format_id,
                ),
                start_to_close_timeout=timedelta(hours=2),
                heartbeat_timeout=timedelta(minutes=5),
                retry_policy=RetryPolicy(
                    initial_interval=timedelta(seconds=10),
                    backoff_coefficient=2.0,
                    maximum_attempts=3,
                ),
            )
        except Exception as e:
            await self._update_status(
                clip_id,
                status=ClipStatus.ERROR,
                error_code=ClipErrorCode.DOWNLOAD_FAILED,
                error_message=str(e)[:500],
            )
            raise

        # --- Trim ---
        await self._update_status(clip_id, status=ClipStatus.TRIMMING)
        self._progress = {"stage": "trimming", "percent": 0.0, "speed": None}

        try:
            trim_result: TrimResult = await workflow.execute_activity(
                trim_video,
                TrimInput(
                    clip_id=clip_id,
                    raw_file_path=download_result.file_path,
                    actual_start=download_result.actual_start,
                    target_start=start_time,
                    target_end=end_time,
                ),
                start_to_close_timeout=timedelta(minutes=10),
                heartbeat_timeout=timedelta(minutes=2),
                retry_policy=RetryPolicy(
                    initial_interval=timedelta(seconds=5),
                    backoff_coefficient=2.0,
                    maximum_attempts=2,
                ),
            )
        except Exception as e:
            await self._update_status(
                clip_id,
                status=ClipStatus.ERROR,
                error_code=ClipErrorCode.TRIM_FAILED,
                error_message=str(e)[:500],
            )
            raise

        # --- Ready ---
        await self._update_status(
            clip_id,
            status=ClipStatus.READY,
            file_path=trim_result.file_path,
            file_size=trim_result.file_size,
            duration=trim_result.duration,
            resolution=trim_result.resolution,
        )
        self._progress = {"stage": "ready", "percent": 100.0, "speed": None}

        return {
            "clip_id": clip_id,
            "file_path": trim_result.file_path,
            "file_size": trim_result.file_size,
            "duration": trim_result.duration,
            "resolution": trim_result.resolution,
        }
