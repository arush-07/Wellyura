from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol


class CatalogRepository(Protocol):
    def summary(self) -> dict[str, Any]: ...
    def list_countries(self) -> list[dict[str, Any]]: ...
    def list_universities(self, **filters: Any) -> tuple[list[dict[str, Any]], int]: ...
    def get_university(self, slug: str) -> dict[str, Any] | None: ...
    def list_programmes(self, **filters: Any) -> tuple[list[dict[str, Any]], int]: ...
    def get_programme(self, slug: str) -> dict[str, Any] | None: ...


class JsonCatalogRepository:
    """Read-only migration repository used before PostgreSQL cutover.

    The application service depends on a repository protocol, so PostgreSQL can replace
    this implementation without changing routes or business use cases.
    """

    def __init__(self, catalog_path: Path) -> None:
        self.catalog_path = catalog_path
        self._catalog = self._load(catalog_path)

    @staticmethod
    @lru_cache(maxsize=4)
    def _load(path: Path) -> dict[str, Any]:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def summary(self) -> dict[str, Any]:
        return {
            "institutions": len(self._catalog["universities"]),
            "programmes": len(self._catalog["programmes"]),
            "countries": len(self._catalog["countries"]),
            "subjects": len(self._catalog["subjects"]),
            "source": self._catalog.get("generatedFrom", "legacy catalogue"),
        }

    def list_countries(self) -> list[dict[str, Any]]:
        return self._catalog["countries"]

    def list_universities(self, **filters: Any) -> tuple[list[dict[str, Any]], int]:
        rows = self._catalog["universities"]
        query = str(filters.get("query") or "").strip().lower()
        country = str(filters.get("country") or "").strip().lower()
        scholarship = bool(filters.get("scholarship"))
        if query:
            rows = [row for row in rows if query in " ".join([row["name"], row.get("abbreviation", ""), row.get("city", ""), row.get("country", "")]).lower()]
        if country:
            rows = [row for row in rows if row.get("countrySlug") == country]
        if scholarship:
            rows = [row for row in rows if row.get("scholarships")]
        total = len(rows)
        offset = max(0, int(filters.get("offset") or 0))
        limit = min(100, max(1, int(filters.get("limit") or 24)))
        return rows[offset : offset + limit], total

    def get_university(self, slug: str) -> dict[str, Any] | None:
        return next((row for row in self._catalog["universities"] if row["slug"] == slug), None)

    def list_programmes(self, **filters: Any) -> tuple[list[dict[str, Any]], int]:
        rows = self._catalog["programmes"]
        query = str(filters.get("query") or "").strip().lower()
        country = str(filters.get("country") or "").strip().lower()
        subject = str(filters.get("subject") or "").strip().lower()
        level = str(filters.get("level") or "").strip().lower()
        university_slug = str(filters.get("university_slug") or "").strip().lower()
        if query:
            rows = [row for row in rows if query in " ".join([row["name"], row.get("universityName", ""), row.get("subject", ""), row.get("city", "")]).lower()]
        if country:
            rows = [row for row in rows if row.get("countrySlug") == country]
        if subject:
            rows = [row for row in rows if row.get("subject", "").lower() == subject]
        if level:
            rows = [row for row in rows if row.get("levelCode", "").lower() == level]
        if university_slug:
            rows = [row for row in rows if row.get("universitySlug") == university_slug]
        total = len(rows)
        offset = max(0, int(filters.get("offset") or 0))
        limit = min(100, max(1, int(filters.get("limit") or 24)))
        return rows[offset : offset + limit], total

    def get_programme(self, slug: str) -> dict[str, Any] | None:
        return next((row for row in self._catalog["programmes"] if row["slug"] == slug), None)
