from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

with workflow.unsafe.imports_passed_through():
    from app.modules.videos.activities import (
        CaptionsInput,
        CaptionsResult,
        ChaptersInput,
        ChaptersResult,
        PersistInput,
        detect_chapters_activity,
        fetch_captions_activity,
        persist_detection_result_activity,
    )
    from app.modules.videos.enums import DetectionMethod, DetectionStatus
    from app.modules.videos.services.detection_heuristics import combine_confidence

EMPTY_PHASE: tuple[None, None, int] = (None, None, 0)
SHORT_CIRCUIT_THRESHOLD = 90


@workflow.defn
class DetectSermonTimestampsWorkflow:
    def __init__(self) -> None:
        self._progress: dict = {"stage": "pending"}

    @workflow.query
    def get_progress(self) -> dict:
        return self._progress

    def _set_progress(self, stage: str, **extra) -> None:
        self._progress = {"stage": stage, **extra}

    async def _persist(self, params: dict, **kwargs) -> None:
        await workflow.execute_activity(
            persist_detection_result_activity,
            PersistInput(detection_id=params["detection_id"], **kwargs),
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

    @workflow.run
    async def run(self, params: dict) -> dict:
        source_url = params["source_url"]
        video_id = params["video_id"]

        # ----- Phase 1: chapters (also detects skip conditions) -----
        self._set_progress("chapters")
        try:
            chapters: ChaptersResult = await workflow.execute_activity(
                detect_chapters_activity,
                ChaptersInput(source_url=source_url),
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=RetryPolicy(maximum_attempts=2),
            )
        except ActivityError as e:
            await self._persist(
                params,
                status=DetectionStatus.FAILED,
                error_message=f"chapters_activity_error: {str(e)[:300]}",
            )
            return {"status": "failed", "stage": "chapters"}

        total_duration = chapters.duration

        if chapters.is_live or total_duration < 300:
            reason = "is_live" if chapters.is_live else "too_short"
            await self._persist(
                params,
                status=DetectionStatus.SKIPPED,
                error_message=f"skipped:{reason}",
                raw_fase_chapters=chapters.raw,
            )
            return {"status": "skipped", "reason": reason}

        chapters_phase: tuple[int | None, int | None, int] = (
            chapters.start_seconds,
            chapters.end_seconds,
            chapters.confidence,
        )

        if chapters.confidence >= SHORT_CIRCUIT_THRESHOLD:
            self._set_progress("persisting", short_circuit="chapters")
            await self._persist(
                params,
                status=DetectionStatus.COMPLETED,
                method=DetectionMethod.CHAPTERS,
                start_seconds=chapters.start_seconds,
                end_seconds=chapters.end_seconds,
                confidence=chapters.confidence,
                raw_fase_chapters=chapters.raw,
            )
            return {
                "status": "completed",
                "method": DetectionMethod.CHAPTERS.value,
                "confidence": chapters.confidence,
            }

        # ----- Phase 2: captions (density) -----
        self._set_progress("captions")
        captions_phase = EMPTY_PHASE
        captions_raw: dict | None = None
        try:
            captions: CaptionsResult = await workflow.execute_activity(
                fetch_captions_activity,
                CaptionsInput(
                    video_id=video_id,
                    source_url=source_url,
                    total_duration=total_duration,
                ),
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=RetryPolicy(maximum_attempts=2),
            )
            captions_phase = (
                captions.start_seconds,
                captions.end_seconds,
                captions.confidence,
            )
            captions_raw = captions.raw
        except ActivityError as e:
            captions_raw = {"error": str(e)[:200]}

        # ----- Combine and persist -----
        chapters_empty = chapters_phase[0] is None
        captions_empty = captions_phase[0] is None

        if chapters_empty and captions_empty:
            self._set_progress("persisting", outcome="skipped")
            await self._persist(
                params,
                status=DetectionStatus.SKIPPED,
                error_message="sem_legendas_disponiveis",
                raw_fase_chapters=chapters.raw,
                raw_fase_captions=captions_raw,
            )
            return {"status": "skipped", "reason": "no_captions"}

        final = combine_confidence(
            chapters=chapters_phase,
            captions=captions_phase,
        )
        start_seconds, end_seconds, confidence, method = final
        method_enum = _map_method_enum(method)
        self._set_progress("persisting", outcome="completed")
        await self._persist(
            params,
            status=DetectionStatus.COMPLETED,
            method=method_enum,
            start_seconds=start_seconds,
            end_seconds=end_seconds,
            confidence=confidence,
            raw_fase_chapters=chapters.raw,
            raw_fase_captions=captions_raw,
        )
        return {
            "status": "completed",
            "method": method_enum.value,
            "confidence": confidence,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
        }


def _map_method_enum(method: str) -> DetectionMethod:
    mapping = {
        "chapters": DetectionMethod.CHAPTERS,
        "captions": DetectionMethod.CAPTIONS,
    }
    return mapping.get(method, DetectionMethod.CASCADE)
