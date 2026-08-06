import pytest
from fastapi import HTTPException
from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    validate_password_strength,
    verify_password,
)


def test_password_hash_and_verify():
    password = "A secure password longer than normal but still valid 123!"
    digest = hash_password(password)
    assert digest != password
    assert verify_password(password, digest)
    assert not verify_password("wrong-password", digest)


def test_long_password_is_supported():
    password = "x" * 200
    digest = hash_password(password)
    assert verify_password(password, digest)


@pytest.mark.parametrize(
    "password, expected_message",
    [
        ("Short1A", "at least 8 characters"),
        ("lowercase1", "uppercase letter"),
        ("UPPERCASE1", "lowercase letter"),
        ("NoNumbers", "number"),
    ],
)
def test_password_strength_rejects_weak_passwords(password, expected_message):
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength(password)
    assert expected_message in str(exc_info.value.detail)


def test_password_strength_accepts_valid_password():
    validate_password_strength("CareerNavIQ1")


def test_access_token_contains_auth_version():
    token = create_access_token(user_id=42, auth_version=7)
    payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    assert payload["sub"] == "42"
    assert payload["ver"] == 7
    assert "exp" in payload
