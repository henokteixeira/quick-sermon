import pytest
import structlog
from sqlalchemy import select

from app.core.security import verify_password
from app.modules.users.enums import UserRole
from app.modules.users.models import User
from seed import seed_admin

EMAIL = "editor-chefe@igreja.test"


async def _admins_com_email(session, email):
    result = await session.execute(select(User).where(User.email == email))
    return result.scalars().all()


async def test_seed_cria_o_admin_com_o_email_e_a_senha_recebidos(db_session):
    await seed_admin(db_session, EMAIL, "senha-de-teste")

    admins = await _admins_com_email(db_session, EMAIL)
    assert len(admins) == 1
    assert admins[0].role == UserRole.ADMIN
    assert verify_password("senha-de-teste", admins[0].password_hash)


async def test_seed_rodado_de_novo_preserva_o_admin_existente(db_session):
    await seed_admin(db_session, EMAIL, "senha-original")
    await seed_admin(db_session, EMAIL, "senha-diferente")

    admins = await _admins_com_email(db_session, EMAIL)
    assert len(admins) == 1
    assert verify_password("senha-original", admins[0].password_hash)


async def test_seed_nunca_registra_a_senha_no_log(db_session):
    with structlog.testing.capture_logs() as eventos:
        await seed_admin(db_session, EMAIL, "senha-de-teste")

    assert eventos
    assert all("senha-de-teste" not in str(evento) for evento in eventos)


async def test_sem_senha_e_sem_admin_o_seed_recusa(db_session):
    with pytest.raises(ValueError):
        await seed_admin(db_session, EMAIL, "")
