import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.app import create_app
from app.core.config import settings
from app.core.database import engine as app_engine
from app.core.models import Base
from app.modules.clips import models as clips_models  # noqa: F401
from app.modules.users import models as users_models  # noqa: F401
from app.modules.videos import models as videos_models  # noqa: F401
from app.modules.youtube import models as youtube_models  # noqa: F401


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    await app_engine.dispose()


async def _create_test_database(url):
    maintenance = create_async_engine(
        url.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    async with maintenance.connect() as connection:
        found = await connection.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": url.database}
        )
        if found.scalar() is None:
            await connection.execute(text(f'CREATE DATABASE "{url.database}"'))
    await maintenance.dispose()


@pytest.fixture
async def db_session():
    url = make_url(settings.DATABASE_URL)
    url = url.set(database=f"{url.database}_test")

    await _create_test_database(url)

    engine = create_async_engine(url)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(
            bind=connection,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        )
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()

    await engine.dispose()
