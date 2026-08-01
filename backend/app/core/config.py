from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Job Match Command Center"
    environment: str = "development"
    secret_key: str = "replace-this-secret"
    database_url: str = "postgresql+psycopg://jobmatch:jobmatch@db:5432/jobmatch"
    frontend_url: str = "http://localhost:3000"
    access_token_minutes: int = 1440
    redis_url: str = "redis://redis:6379/0"
    rapidapi_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
