from app.core.exceptions import NotFoundException, ValidationException


class ClipNotFoundException(NotFoundException):
    def __init__(self, identifier: str | None = None):
        super().__init__("Clip", identifier)


class InvalidTimestampsException(ValidationException):
    def __init__(self, message: str = "Timestamps invalidos para este video."):
        super().__init__(message)


class ClipAlreadyProcessingException(ValidationException):
    def __init__(self):
        super().__init__("Este clip ja esta sendo processado.")
