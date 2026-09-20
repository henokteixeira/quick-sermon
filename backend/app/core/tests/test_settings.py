import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_sem_chave_jwt_as_settings_nao_carregam(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)

    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)

    assert "SECRET_KEY" in str(exc.value)
