from app.core.config import settings


async def test_origem_desconhecida_nao_recebe_permissao_de_cors(client):
    response = await client.get("/health", headers={"Origin": "http://outra-pagina.test"})

    assert "access-control-allow-origin" not in response.headers


async def test_origem_do_frontend_recebe_permissao_de_cors(client):
    response = await client.get("/health", headers={"Origin": settings.FRONTEND_URL})

    assert response.headers["access-control-allow-origin"] == settings.FRONTEND_URL


async def test_preflight_da_origem_do_frontend_e_aceito(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": settings.FRONTEND_URL,
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == settings.FRONTEND_URL
