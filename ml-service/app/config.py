from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Remote MySQL (via SSH tunnel)
    remote_db_url: str = "mysql+pymysql://ahnbi2:bigdata@host.docker.internal:3306/etf2_db"

    # Local SQLite for predictions
    local_db_path: str = "/app/data/predictions.db"

    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
