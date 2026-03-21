from enum import StrEnum


class VideoStatus(StrEnum):
    PENDING = "pending"
    DETECTING = "detecting"
    PROCESSING = "processing"
    AWAITING_REVIEW = "awaiting_review"
    PUBLISHED = "published"
    ERROR = "error"
