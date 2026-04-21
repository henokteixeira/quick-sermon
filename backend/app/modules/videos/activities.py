from dataclasses import dataclass, field
from pathlib import Path

import structlog
from temporalio import activity

from app.core.config import settings
from app.modules.videos.services.detection_clients import (
    CaptionsFetcher,
    ChaptersFetcher,
)
from app.modules.videos.services.detection_heuristics import (
    compute_confidence_from_captions,
    compute_confidence_from_chapters,
)
from app.modules.videos.services.update_detection_status_service import (
    update_detection_status,
)

logger = structlog.get_logger()


@dataclass
class ChaptersInput:
    source_url: str


@dataclass
class ChaptersResult:
    start_seconds: int | None
    end_seconds: int | None
    confidence: int
    raw: dict
    duration: int
    is_live: bool


@dataclass
class CaptionsInput:
    video_id: str
    source_url: str
    total_duration: int


@dataclass
class CaptionsResult:
    start_seconds: int | None
    end_seconds: int | None
    confidence: int
    raw: dict
    cues: list[dict] = field(default_factory=list)


@dataclass
class PersistInput:
    detection_id: str
    status: str
    method: str | None = None
    start_seconds: int | None = None
    end_seconds: int | None = None
    confidence: int | None = None
    error_message: str | None = None
    raw_fase_chapters: dict | None = None
    raw_fase_captions: dict | None = None
    raw_fase_vad: dict | None = None
    raw_fase_llm: dict | None = None


@activity.defn
async def detect_chapters_activity(input: ChaptersInput) -> ChaptersResult:
    fetcher = ChaptersFetcher()
    data = await fetcher.fetch(input.source_url)
    chapters = data["chapters"]
    start, end, confidence = compute_confidence_from_chapters(chapters)
    return ChaptersResult(
        start_seconds=start,
        end_seconds=end,
        confidence=confidence,
        raw={"chapters_count": len(chapters), "chapters": chapters[:20]},
        duration=data["duration"],
        is_live=data["is_live"],
    )


@activity.defn
async def fetch_captions_activity(input: CaptionsInput) -> CaptionsResult:
    video_dir = Path(settings.VIDEOS_BASE_DIR) / input.video_id
    fetcher = CaptionsFetcher()
    cues = await fetcher.fetch_pt_captions(input.source_url, str(video_dir))
    cue_dicts = [{"start": c.start, "end": c.end, "text": c.text} for c in cues]
    start, end, confidence = compute_confidence_from_captions(cue_dicts, input.total_duration)
    return CaptionsResult(
        start_seconds=start,
        end_seconds=end,
        confidence=confidence,
        raw={"cues_count": len(cues), "first_cue": cue_dicts[0] if cue_dicts else None},
        cues=cue_dicts,
    )


@activity.defn
async def persist_detection_result_activity(input: PersistInput) -> None:
    await update_detection_status(
        detection_id=input.detection_id,
        status=input.status,
        method=input.method,
        start_seconds=input.start_seconds,
        end_seconds=input.end_seconds,
        confidence=input.confidence,
        error_message=input.error_message,
        raw_fase_chapters=input.raw_fase_chapters,
        raw_fase_captions=input.raw_fase_captions,
        raw_fase_vad=input.raw_fase_vad,
        raw_fase_llm=input.raw_fase_llm,
    )
