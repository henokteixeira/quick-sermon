from app.core.exceptions import AppException


class InvalidCredentialsException(AppException):
    def __init__(self):
        super().__init__(
            message="Invalid email or password",
            code="INVALID_CREDENTIALS",
            status_code=401,
        )


class AccountDisabledException(AppException):
    def __init__(self):
        super().__init__(
            message="Account is disabled",
            code="ACCOUNT_DISABLED",
            status_code=403,
        )
