from datetime import datetime, timedelta, timezone
from hashlib import sha256
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

_hasher = PasswordHasher()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    return _hasher.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def create_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expires}, settings.secret_key, algorithm="HS256")

def password_hash_fingerprint(password_hash: str) -> str:
    return sha256(password_hash.encode("utf-8")).hexdigest()[:24]

def create_password_reset_token(user_id: int, password_hash: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    return jwt.encode(
        {
            "sub": str(user_id),
            "purpose": "password_reset",
            "ph": password_hash_fingerprint(password_hash),
            "exp": expires,
        },
        settings.secret_key,
        algorithm="HS256",
    )

def decode_password_reset_token(token: str) -> tuple[int, str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        if payload.get("purpose") != "password_reset":
            raise ValueError("Wrong token purpose")
        return int(payload["sub"]), str(payload["ph"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=400, detail="This recovery link is invalid or has expired")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or missing")
    return user
