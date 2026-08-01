from app.core.security import hash_password, verify_password

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
