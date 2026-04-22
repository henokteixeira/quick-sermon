from collections.abc import Sequence

from app.modules.clips.enums import ClipStatus
from app.modules.clips.repositories.clip_repository import ClipRepository
from app.modules.videos.models import Video
from app.modules.videos.repositories.video_detection_repository import (
    VideoDetectionRepository,
)
from app.modules.videos.schemas import VideoResponse
from app.modules.videos.services.compute_aggregated_status import (
    compute_aggregated_status,
)


async def build_video_responses(
    videos: Sequence[Video],
    clip_repo: ClipRepository,
    detection_repo: VideoDetectionRepository,
) -> list[VideoResponse]:
    if not videos:
        return []
    video_ids = [v.id for v in videos]
    status_counts = await clip_repo.get_status_counts_by_video_ids(video_ids)
    detection_status = await detection_repo.get_latest_status_by_video_ids(video_ids)

    responses: list[VideoResponse] = []
    for video in videos:
        response = VideoResponse.model_validate(video)
        counts = status_counts.get(video.id, {})
        response.clip_count = sum(
            count for status, count in counts.items() if status != ClipStatus.DISCARDED
        )
        response.aggregated_status = compute_aggregated_status(
            clip_counts=counts,
            detection_status=detection_status.get(video.id),
            base_status=video.status,
        )
        responses.append(response)
    return responses
