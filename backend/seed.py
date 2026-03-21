"""Seed script for initial data."""

import asyncio

import structlog
from sqlalchemy import select

from app.core.database import async_session
from app.core.logging import setup_logging
from app.core.security import hash_password
from app.modules.users.enums import UserRole
from app.modules.users.models import User

logger = structlog.get_logger()

ADMIN_EMAIL = "admin@quicksermon.com"
ADMIN_NAME = "Admin"
ADMIN_PASSWORD = "admin123456"


async def main() -> None:
    setup_logging(debug=True)
    logger.info("seed_started")

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            logger.info("admin_already_exists", email=ADMIN_EMAIL)
        else:
            admin = User(
                email=ADMIN_EMAIL,
                name=ADMIN_NAME,
                password_hash=hash_password(ADMIN_PASSWORD),
                role=UserRole.ADMIN,
            )
            session.add(admin)
            await session.commit()
            logger.info("admin_created", email=ADMIN_EMAIL)
            logger.warning("change_admin_password", password=ADMIN_PASSWORD)

    logger.info("seed_completed")


if __name__ == "__main__":
    asyncio.run(main())
