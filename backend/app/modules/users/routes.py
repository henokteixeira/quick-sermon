from fastapi import APIRouter, Depends, Query

from app.modules.auth.dependencies import get_current_user, require_role
from app.modules.users.dependencies import get_user_repository
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.users.schemas import UserResponse, UserUpdateSelf
from app.modules.users.services.get_profile_service import GetProfileService
from app.modules.users.services.list_users_service import ListUsersService
from app.modules.users.services.update_profile_service import UpdateProfileRequest, UpdateProfileService

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    service = GetProfileService()
    return await service.execute(user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdateSelf,
    user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository),
):
    service = UpdateProfileService(user_repo)
    return await service.execute(user, UpdateProfileRequest(name=data.name, password=data.password))


@router.get("/", response_model=list[UserResponse])
async def list_users(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    user_repo: UserRepository = Depends(get_user_repository),
):
    service = ListUsersService(user_repo)
    return await service.execute(offset=offset, limit=limit)
