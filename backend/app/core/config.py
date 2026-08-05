from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CareerOS"
    environment: str = "development"
    secret_key: str = "replace-this-secret"
    database_url: str = "postgresql+psycopg://jobmatch:jobmatch@db:5432/jobmatch"
    frontend_url: str = "http://localhost:3000"
    allowed_origins: str = "http://localhost:3000"
    access_token_minutes: int = 1440
    redis_url: str = "redis://redis:6379/0"
    rapidapi_key: str = ""
    scheduler_enabled: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("secret_key")
    @classmethod
    def validate_secret(cls, value: str, info):
        if info.data.get("environment") == "production" and value == "replace-this-secret":
            raise ValueError("SECRET_KEY must be replaced in production")
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
