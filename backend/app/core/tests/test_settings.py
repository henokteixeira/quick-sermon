import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_sem_chave_jwt_as_settings_nao_carregam(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)

    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)

    assert "SECRET_KEY" in str(exc.value)


def test_chave_jwt_vazia_tambem_e_recusada(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "")

    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)

    assert "SECRET_KEY" in str(exc.value)
    assert "at least 32 characters" in str(exc.value)
