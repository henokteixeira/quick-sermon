from app.core.exceptions import ConflictException, NotFoundException, ValidationException


class VideoNotFoundException(NotFoundException):
    def __init__(self, identifier: str | None = None):
        super().__init__("Video", identifier)


class DuplicateVideoException(ConflictException):
    def __init__(self, url: str):
        super().__init__(f"Video with URL '{url}' has already been submitted")


class InvalidTimestampsException(ValidationException):
    def __init__(self, message: str = "Invalid timestamps"):
        super().__init__(message)
