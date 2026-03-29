import os

import pytest

from app.modules.youtube.services.token_encryption_service import decrypt_token, encrypt_token


@pytest.fixture(autouse=True)
def _set_encryption_key(monkeypatch):
    from cryptography.fernet import Fernet

    key = Fernet.generate_key().decode()
    monkeypatch.setenv("YOUTUBE_OAUTH_ENCRYPTION_KEY", key)
    # Force settings reload
    from app.core.config import Settings

    monkeypatch.setattr("app.modules.youtube.services.token_encryption_service.settings", Settings())


def test_encrypt_decrypt_roundtrip():
    original = "ya29.a0AfB_byC-test-access-token"
    encrypted = encrypt_token(original)
    assert encrypted != original
    assert decrypt_token(encrypted) == original


def test_encrypt_produces_different_ciphertexts():
    token = "my-refresh-token-123"
    enc1 = encrypt_token(token)
    enc2 = encrypt_token(token)
    assert enc1 != enc2  # Fernet uses random IV
    assert decrypt_token(enc1) == token
    assert decrypt_token(enc2) == token


def test_decrypt_invalid_token_raises():
    with pytest.raises(Exception):
        decrypt_token("not-a-valid-fernet-token")
