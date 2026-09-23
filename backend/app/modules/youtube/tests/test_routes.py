from app.core.database import get_db
from app.core.security import create_access_token
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from app.modules.youtube.models import YouTubeConnection


async def test_consultar_o_consumo_do_youtube_responde_404(app, client, db_session):
    admin = User(
        email="admin@igreja.test", name="Admin", password_hash="x", role=UserRole.ADMIN
    )
    db_session.add(admin)
    await db_session.flush()
    db_session.add(
        YouTubeConnection(
            access_token="enc-access",
            refresh_token="enc-refresh",
            channel_id="UC1",
            channel_title="Canal Teste",
            connected_by=admin.id,
        )
    )
    await db_session.flush()

    async def _sessao_do_teste():
        yield db_session

    app.dependency_overrides[get_db] = _sessao_do_teste
    token = create_access_token({"sub": str(admin.id)})

    response = await client.get(
        "/api/youtube/quota", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 404
