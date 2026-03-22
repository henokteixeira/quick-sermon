from app.modules.users.models import User
from app.modules.users.schemas import UserResponse


class GetProfileService:
    async def execute(self, user: User) -> UserResponse:
        return UserResponse.model_validate(user)
