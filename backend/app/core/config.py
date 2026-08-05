from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="WELLYURA_",
        case_sensitive=False,
        extra="ignore",
    )

    env: str = "development"
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/wellyura"
    supabase_url: str = ""
    supabase_jwt_audience: str = "authenticated"
    supabase_jwks_url: str = ""
    use_json_catalog: bool = True
    catalog_path: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[1] / "data" / "catalog.json")

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
