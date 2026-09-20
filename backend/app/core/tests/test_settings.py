import pytest
from pydantic import ValidationError

from app.core.config import Settings

TAMANHO_MINIMO = 32


def test_sem_chave_jwt_as_settings_nao_carregam(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)

    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)

    assert "SECRET_KEY" in str(exc.value)


def test_chave_jwt_curta_demais_e_recusada(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "a" * (TAMANHO_MINIMO - 1))

    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)

    assert "SECRET_KEY" in str(exc.value)


def test_chave_jwt_no_tamanho_minimo_carrega(monkeypatch):
    chave = "a" * TAMANHO_MINIMO
    monkeypatch.setenv("SECRET_KEY", chave)

    assert Settings(_env_file=None).SECRET_KEY == chave
