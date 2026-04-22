from app.core.exceptions import ConflictException, NotFoundException, ValidationException


class VideoNotFoundException(NotFoundException):
    def __init__(self, identifier: str | None = None):
        super().__init__("Video", identifier)


class DuplicateVideoException(ConflictException):
    def __init__(self, url: str):
        super().__init__(f"Video with URL '{url}' has already been submitted")


class InvalidYouTubeUrlException(ValidationException):
    def __init__(self):
        super().__init__("URL invalida. Cole um link do YouTube.")


class VideoInaccessibleException(ValidationException):
    def __init__(self, message: str = "Video inacessivel. Verifique se o link esta correto."):
        super().__init__(message)


class YouTubeRateLimitException(ValidationException):
    def __init__(self):
        super().__init__(
            "O YouTube esta limitando nossas requisicoes. "
            "Aguarde alguns minutos e tente novamente."
        )


class DetectionNotFoundException(NotFoundException):
    def __init__(self, identifier: str | None = None):
        super().__init__("Detection", identifier)


class DetectionRetryNotAllowedException(ValidationException):
    def __init__(self, status: str):
        super().__init__(
            f"Retry nao permitido para deteccao com status '{status}'. "
            "Permitido apenas para 'failed' ou 'skipped'."
        )
