from __future__ import annotations

from typing import Any

from app.core.errors import NotFoundError
from app.repositories.catalog import CatalogRepository


class CatalogService:
    def __init__(self, repository: CatalogRepository) -> None:
        self.repository = repository

    def summary(self) -> dict[str, Any]:
        return self.repository.summary()

    def countries(self) -> list[dict[str, Any]]:
        return self.repository.list_countries()

    def universities(self, **filters: Any) -> tuple[list[dict[str, Any]], int]:
        return self.repository.list_universities(**filters)

    def university(self, slug: str) -> dict[str, Any]:
        row = self.repository.get_university(slug)
        if not row:
            raise NotFoundError("University", slug)
        return row

    def programmes(self, **filters: Any) -> tuple[list[dict[str, Any]], int]:
        return self.repository.list_programmes(**filters)

    def programme(self, slug: str) -> dict[str, Any]:
        row = self.repository.get_programme(slug)
        if not row:
            raise NotFoundError("Programme", slug)
        return row

    def search(self, query: str, limit: int = 8) -> dict[str, Any]:
        universities, _ = self.universities(query=query, limit=limit, offset=0)
        programmes, _ = self.programmes(query=query, limit=limit, offset=0)
        countries = [row for row in self.countries() if query.lower() in row["name"].lower()][:limit]
        return {"query": query, "universities": universities, "programmes": programmes, "countries": countries}
