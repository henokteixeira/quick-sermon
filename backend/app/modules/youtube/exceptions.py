from app.core.exceptions import (
    AppException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)


class YouTubeConnectionNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("YouTubeConnection")


class YouTubeUploadNotFoundException(NotFoundException):
    def __init__(self, identifier: str | None = None):
        super().__init__("YouTubeUpload", identifier)


class QuotaExceededException(ValidationException):
    def __init__(self):
        super().__init__("Quota diaria do YouTube excedida. Tente novamente amanha.")


class QuotaWarningException(ValidationException):
    def __init__(self, percent_used: int):
        super().__init__(
            f"Atencao: {percent_used}% da quota diaria do YouTube utilizada."
        )


class YouTubeAuthFailedException(AppException):
    def __init__(self, message: str = "Falha na autenticacao com o YouTube."):
        super().__init__(
            message=message,
            code="YOUTUBE_AUTH_FAILED",
            status_code=502,
        )


class NotAdminException(ForbiddenException):
    def __init__(self):
        super().__init__("Apenas administradores podem gerenciar a conexao com YouTube.")


class ClipNotReadyException(ValidationException):
    def __init__(self):
        super().__init__("O clip precisa estar com status 'ready' para upload.")
