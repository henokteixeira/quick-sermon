from app.core.exceptions import ConflictException, NotFoundException


class UserNotFoundException(NotFoundException):
    def __init__(self, identifier: str | None = None):
        super().__init__("User", identifier)


class DuplicateEmailException(ConflictException):
    def __init__(self, email: str):
        super().__init__(f"Email '{email}' is already registered")
