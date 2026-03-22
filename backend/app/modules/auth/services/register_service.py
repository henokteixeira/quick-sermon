from app.core.security import hash_password
from app.modules.auth.schemas import RegisterRequest
from app.modules.users.enums import UserRole
from app.modules.users.exceptions import DuplicateEmailException
from app.modules.users.models import User
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.users.schemas import UserResponse


class RegisterService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, data: RegisterRequest) -> UserResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise DuplicateEmailException(data.email)

        user = User(
            email=data.email,
            name=data.name,
            password_hash=hash_password(data.password),
            role=UserRole.EDITOR.value,
        )
        created = await self.user_repo.create(user)
        return UserResponse.model_validate(created)
