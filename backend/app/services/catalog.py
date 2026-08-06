from __future__ import annotations

from typing import Any

from app.core.errors import NotFoundError
from app.repositories.catalog import CatalogRepository


class CatalogService:
    def __init__(self, repository: CatalogRepository) -> None:
        self.repository = repository

    async def summary(self) -> dict[str, Any]:
        return await self.repository.summary()

    async def countries(self) -> list[dict[str, Any]]:
        return await self.repository.list_countries()

    async def universities(self, **filters: Any) -> tuple[list[dict[str, Any]], int]:
        return await self.repository.list_universities(**filters)

    async def university(self, slug: str) -> dict[str, Any]:
        row = await self.repository.get_university(slug)
        if not row:
            raise NotFoundError("University", slug)
        return row

    async def programmes(self, **filters: Any) -> tuple[list[dict[str, Any]], int]:
        return await self.repository.list_programmes(**filters)

    async def programme(self, slug: str) -> dict[str, Any]:
        row = await self.repository.get_programme(slug)
        if not row:
            raise NotFoundError("Programme", slug)
        return row

    async def search(self, query: str, limit: int = 8) -> dict[str, Any]:
        universities, _ = await self.universities(query=query, limit=limit, offset=0)
        programmes, _ = await self.programmes(query=query, limit=limit, offset=0)
        country_rows = await self.countries()
        countries = [
            row
            for row in country_rows
            if query.lower() in row["name"].lower()
        ][:limit]
        return {"query": query, "universities": universities, "programmes": programmes, "countries": countries}
