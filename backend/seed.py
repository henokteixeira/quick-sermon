"""Seed script for initial data."""

import asyncio

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session
from app.core.logging import setup_logging
from app.core.security import hash_password
from app.modules.users.enums import UserRole
from app.modules.users.models import User

logger = structlog.get_logger()

ADMIN_NAME = "Admin"


async def seed_admin(session: AsyncSession, email: str, password: str) -> None:
    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        logger.info("admin_already_exists", email=email)
        return

    if not password:
        raise ValueError("SEED_ADMIN_PASSWORD is not set")

    session.add(
        User(
            email=email,
            name=ADMIN_NAME,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
        )
    )
    await session.commit()
    logger.info("admin_created", email=email)


async def main() -> None:
    setup_logging(debug=True)
    logger.info("seed_started")

    async with async_session() as session:
        await seed_admin(session, settings.SEED_ADMIN_EMAIL, settings.SEED_ADMIN_PASSWORD)

    logger.info("seed_completed")


if __name__ == "__main__":
    asyncio.run(main())
