from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.modules.users.dependencies import get_user_repository
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from app.modules.users.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException()
    except UnauthorizedException:
        raise
    except Exception:
        raise UnauthorizedException()

    user = await user_repo.get_by_id(UUID(user_id))
    if not user or not user.is_active:
        raise UnauthorizedException()
    return user


def require_role(*roles: UserRole):
    role_values = [r.value for r in roles]

    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in role_values:
            raise ForbiddenException()
        return user

    return role_checker
