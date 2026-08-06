from __future__ import annotations

from functools import lru_cache

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_session
from app.repositories.catalog import (
    JsonCatalogRepository,
    PostgresCatalogRepository,
)
from app.services.catalog import CatalogService


@lru_cache
def get_json_catalog_service() -> CatalogService:
    settings = get_settings()
    repository = JsonCatalogRepository(
        settings.catalog_path,
    )
    return CatalogService(repository)


async def get_catalog_service(
    session: AsyncSession = Depends(
        get_db_session,
    ),
) -> CatalogService:
    settings = get_settings()

    if settings.use_json_catalog:
        return get_json_catalog_service()

    repository = PostgresCatalogRepository(
        session,
    )
    return CatalogService(repository)
