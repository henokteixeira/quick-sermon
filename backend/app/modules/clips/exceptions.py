from app.core.exceptions import ConflictException, NotFoundException, ValidationException


class ClipNotFoundException(NotFoundException):
    def __init__(self, identifier: str | None = None):
        super().__init__("Clip", identifier)


class InvalidTimestampsException(ValidationException):
    def __init__(self, message: str = "Timestamps invalidos para este video."):
        super().__init__(message)


class ClipAlreadyProcessingException(ValidationException):
    def __init__(self):
        super().__init__("Este clip ja esta sendo processado.")


class ClipNotInReviewException(ConflictException):
    def __init__(self, current_status: str | None = None):
        message = "Este clip nao esta em revisao."
        if current_status:
            message = f"Este clip nao esta em revisao (status atual: {current_status})."
        super().__init__(message)


class InvalidClipDraftException(ValidationException):
    def __init__(self, message: str = "Conteudo do rascunho invalido."):
        super().__init__(message)


class ClipUploadMissingException(ValidationException):
    def __init__(self):
        super().__init__("Nenhum upload do YouTube encontrado para este clip.")
