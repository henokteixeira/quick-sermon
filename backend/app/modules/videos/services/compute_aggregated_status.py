from app.modules.clips.enums import ClipStatus
from app.modules.videos.enums import DetectionStatus, VideoStatus

ACTIVE_CLIP_STATUSES = {
    ClipStatus.PENDING,
    ClipStatus.DOWNLOADING,
    ClipStatus.TRIMMING,
    ClipStatus.UPLOADING,
}


def compute_aggregated_status(
    clip_counts: dict[str, int],
    detection_status: str | None,
    base_status: str,
) -> VideoStatus:
    total_non_discarded = sum(
        count
        for status, count in clip_counts.items()
        if status != ClipStatus.DISCARDED
    )
    active = sum(
        count
        for status, count in clip_counts.items()
        if status in ACTIVE_CLIP_STATUSES
    )
    awaiting_review = clip_counts.get(ClipStatus.AWAITING_REVIEW, 0)
    published = clip_counts.get(ClipStatus.PUBLISHED, 0)

    if active > 0:
        return VideoStatus.PROCESSING
    if awaiting_review > 0:
        return VideoStatus.AWAITING_REVIEW
    if published > 0 and published == total_non_discarded:
        return VideoStatus.PUBLISHED
    if detection_status == DetectionStatus.RUNNING:
        return VideoStatus.DETECTING
    if detection_status == DetectionStatus.FAILED:
        return VideoStatus.ERROR
    try:
        return VideoStatus(base_status)
    except ValueError:
        return VideoStatus.PENDING
