import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.modules.users.enums import UserRole


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.EDITOR


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None
