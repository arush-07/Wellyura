from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.repositories.catalog import JsonCatalogRepository
from app.services.catalog import CatalogService


@lru_cache
def get_catalog_service() -> CatalogService:
    settings = get_settings()
    repository = JsonCatalogRepository(settings.catalog_path)
    return CatalogService(repository)
