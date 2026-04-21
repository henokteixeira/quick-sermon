from enum import StrEnum


class VideoStatus(StrEnum):
    PENDING = "pending"
    DETECTING = "detecting"
    PROCESSING = "processing"
    AWAITING_REVIEW = "awaiting_review"
    PUBLISHED = "published"
    ERROR = "error"


class DetectionStatus(StrEnum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class DetectionMethod(StrEnum):
    CHAPTERS = "chapters"
    CAPTIONS = "captions"
    CASCADE = "cascade"
