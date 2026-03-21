from fastapi import APIRouter, Depends, status

from app.modules.auth.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.modules.auth.services.login_service import LoginService
from app.modules.auth.services.refresh_service import RefreshService
from app.modules.auth.services.register_service import RegisterService
from app.modules.users.dependencies import get_user_repository
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.users.schemas import UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    user_repo: UserRepository = Depends(get_user_repository),
):
    service = LoginService(user_repo)
    return await service.execute(data)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    user_repo: UserRepository = Depends(get_user_repository),
):
    service = RegisterService(user_repo)
    return await service.execute(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshRequest,
    user_repo: UserRepository = Depends(get_user_repository),
):
    service = RefreshService(user_repo)
    return await service.execute(data.refresh_token)
