from app.core.exceptions import AppException


class LLMUnavailableException(AppException):
    def __init__(self):
        super().__init__(
            message="LLM service is unavailable",
            code="LLM_UNAVAILABLE",
            status_code=503,
        )


class GenerationFailedException(AppException):
    def __init__(self, detail: str = "Content generation failed"):
        super().__init__(
            message=detail,
            code="GENERATION_FAILED",
            status_code=500,
        )
