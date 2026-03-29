from app.core.security import hash_password
from app.modules.users.models import User
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.users.schemas import UserResponse


class UpdateProfileRequest:
    def __init__(self, name: str | None = None, password: str | None = None):
        self.name = name
        self.password = password


class UpdateProfileService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, user: User, data: UpdateProfileRequest) -> UserResponse:
        if data.name is not None:
            user.name = data.name
        if data.password is not None:
            user.password_hash = hash_password(data.password)
        await self.user_repo.update(user)
        return UserResponse.model_validate(user)
