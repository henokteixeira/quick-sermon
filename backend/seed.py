"""Seed script for initial data."""

import asyncio

import structlog

from app.core.logging import setup_logging

logger = structlog.get_logger()


async def main() -> None:
    setup_logging(debug=True)
    logger.info("seed_started")

    # TODO: Create admin user when auth module is implemented

    logger.info("seed_completed")


if __name__ == "__main__":
    asyncio.run(main())
