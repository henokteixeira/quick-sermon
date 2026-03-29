from enum import StrEnum


class YouTubeUploadStatus(StrEnum):
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"


class YouTubeUploadErrorCode(StrEnum):
    QUOTA_EXCEEDED = "quota_exceeded"
    AUTH_EXPIRED = "auth_expired"
    UPLOAD_FAILED = "upload_failed"
    FILE_NOT_FOUND = "file_not_found"
    NETWORK_ERROR = "network_error"
