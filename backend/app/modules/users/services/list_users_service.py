from app.modules.users.repositories.user_repository import UserRepository
from app.modules.users.schemas import UserResponse


class ListUsersService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, offset: int = 0, limit: int = 50) -> list[UserResponse]:
        users = await self.user_repo.list_all(offset=offset, limit=limit)
        return [UserResponse.model_validate(u) for u in users]
