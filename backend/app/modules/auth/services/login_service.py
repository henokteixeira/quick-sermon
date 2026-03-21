from app.core.security import create_access_token, create_refresh_token, verify_password
from app.modules.auth.exceptions import AccountDisabledException, InvalidCredentialsException
from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.users.repositories.user_repository import UserRepository


class LoginService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, data: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise InvalidCredentialsException()
        if not user.is_active:
            raise AccountDisabledException()

        token_data = {"sub": str(user.id), "role": user.role}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )
