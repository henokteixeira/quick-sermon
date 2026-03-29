from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.modules.clips.enums import ClipStatus
    from app.modules.youtube.activities import (
        UploadInput,
        UploadResult,
        UploadStatusInput,
        increment_quota,
        update_upload_status,
        upload_to_youtube,
    )
    from app.modules.youtube.enums import YouTubeUploadErrorCode, YouTubeUploadStatus

STATUS_TIMEOUT = timedelta(seconds=30)
STATUS_RETRY = RetryPolicy(
    initial_interval=timedelta(seconds=5),
    backoff_coefficient=2.0,
    maximum_attempts=3,
)


@workflow.defn
class UploadToYouTubeWorkflow:
    def __init__(self) -> None:
        self._progress: dict = {
            "stage": "pending",
            "percent": 0.0,
            "speed": None,
        }

    @workflow.query
    def get_progress(self) -> dict:
        return self._progress

    @workflow.run
    async def run(self, params: dict) -> dict:
        upload_id = params["upload_id"]
        clip_id = params["clip_id"]
        file_path = params["file_path"]
        title = params["title"]
        description = params["description"]

        self._progress = {"stage": "uploading", "percent": 0.0, "speed": None}

        try:
            result: UploadResult = await workflow.execute_activity(
                upload_to_youtube,
                UploadInput(
                    upload_id=upload_id,
                    clip_id=clip_id,
                    file_path=file_path,
                    title=title,
                    description=description,
                ),
                start_to_close_timeout=timedelta(hours=2),
                heartbeat_timeout=timedelta(minutes=5),
                retry_policy=RetryPolicy(
                    initial_interval=timedelta(seconds=30),
                    backoff_coefficient=2.0,
                    maximum_attempts=3,
                ),
            )
        except Exception as e:
            await workflow.execute_activity(
                update_upload_status,
                UploadStatusInput(
                    upload_id=upload_id,
                    clip_id=clip_id,
                    status=YouTubeUploadStatus.FAILED,
                    error_code=YouTubeUploadErrorCode.UPLOAD_FAILED,
                    error_message=str(e)[:500],
                    clip_status=ClipStatus.READY,
                ),
                start_to_close_timeout=STATUS_TIMEOUT,
            )
            self._progress = {"stage": "error", "percent": 0.0, "speed": None}
            raise

        # Mark upload as completed
        await workflow.execute_activity(
            update_upload_status,
            UploadStatusInput(
                upload_id=upload_id,
                clip_id=clip_id,
                youtube_video_id=result.youtube_video_id,
                youtube_url=result.youtube_url,
                status=YouTubeUploadStatus.COMPLETED,
                clip_status=ClipStatus.PUBLISHED,
            ),
            start_to_close_timeout=STATUS_TIMEOUT,
            retry_policy=STATUS_RETRY,
        )

        # Increment quota counter
        await workflow.execute_activity(
            increment_quota,
            start_to_close_timeout=STATUS_TIMEOUT,
            retry_policy=STATUS_RETRY,
        )

        self._progress = {"stage": "published", "percent": 100.0, "speed": None}

        return {
            "upload_id": upload_id,
            "youtube_video_id": result.youtube_video_id,
            "youtube_url": result.youtube_url,
        }
