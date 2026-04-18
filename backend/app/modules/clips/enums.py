from enum import StrEnum


class ClipType(StrEnum):
    SERMON = "sermon"
    SHORT = "short"


class ClipStatus(StrEnum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    TRIMMING = "trimming"
    READY = "ready"
    UPLOADING = "uploading"
    AWAITING_REVIEW = "awaiting_review"
    PUBLISHED = "published"
    DISCARDED = "discarded"
    ERROR = "error"


class ClipErrorCode(StrEnum):
    DOWNLOAD_FAILED = "download_failed"
    DOWNLOAD_TIMEOUT = "download_timeout"
    TRIM_FAILED = "trim_failed"
    TRIM_CORRUPTED = "trim_corrupted"
    INVALID_TIMESTAMPS = "invalid_timestamps"
    VIDEO_UNAVAILABLE = "video_unavailable"
