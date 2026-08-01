from __future__ import annotations
import json
from redis import Redis
from app.core.config import settings

_client = Redis.from_url(settings.redis_url, decode_responses=True)

def get_json(key: str):
    try:
        value = _client.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None

def set_json(key: str, value, ttl_seconds: int = 21600):
    try:
        _client.setex(key, ttl_seconds, json.dumps(value))
    except Exception:
        pass

def stats():
    try:
        return {"connected": bool(_client.ping()), "keys": _client.dbsize()}
    except Exception:
        return {"connected": False, "keys": 0}
