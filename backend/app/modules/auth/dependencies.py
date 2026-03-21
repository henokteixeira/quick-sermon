from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException()
    except Exception:
        raise UnauthorizedException()

    # TODO: Fetch user from database
    return {"id": user_id, "role": payload.get("role")}


def require_role(*roles: str):
    async def role_checker(current_user=Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise ForbiddenException()
        return current_user

    return role_checker
