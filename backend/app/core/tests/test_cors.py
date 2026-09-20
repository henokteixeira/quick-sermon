import pytest
from httpx import ASGITransport, AsyncClient

from app.core.app import create_app
from app.core.config import settings

ORIGEM_DO_FRONTEND = "https://clips.igreja.test"


@pytest.fixture
async def client(monkeypatch):
    monkeypatch.setattr(settings, "FRONTEND_URL", ORIGEM_DO_FRONTEND)
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as ac:
        yield ac


async def test_origem_desconhecida_nao_recebe_permissao_de_cors(client):
    response = await client.get("/health", headers={"Origin": "http://outra-pagina.test"})

    assert "access-control-allow-origin" not in response.headers


async def test_origem_do_frontend_recebe_permissao_de_cors(client):
    response = await client.get("/health", headers={"Origin": ORIGEM_DO_FRONTEND})

    assert response.headers["access-control-allow-origin"] == ORIGEM_DO_FRONTEND


async def test_preflight_de_origem_desconhecida_e_recusado(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://outra-pagina.test",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert "access-control-allow-origin" not in response.headers
