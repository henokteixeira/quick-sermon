import os

os.environ.setdefault("SECRET_KEY", "chave-de-teste-sem-valor-em-producao")

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # noqa: E402

from app.core.app import create_app  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.database import engine as app_engine  # noqa: E402
from app.core.models import Base  # noqa: E402
from app.modules.clips import models as clips_models  # noqa: E402, F401
from app.modules.users import models as users_models  # noqa: E402, F401
from app.modules.videos import models as videos_models  # noqa: E402, F401
from app.modules.youtube import models as youtube_models  # noqa: E402, F401


@pytest.fixture
def app():
    return create_app()


@pytest.fixture(autouse=True)
async def _descarta_conexoes_da_aplicacao():
    yield
    await app_engine.dispose()


@pytest.fixture
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


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
    assert url.database.endswith("_test")

    await _create_test_database(url)

    engine = create_async_engine(url)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
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
