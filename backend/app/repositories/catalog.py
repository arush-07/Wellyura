from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


JSON_ENCODED_FIELDS = frozenset(
    {
        "campuses",
        "contacts",
        "intakes",
        "deadlines",
        "eligibility",
        "internships",
        "campus_life",
        "security",
        "scholarships",
        "top_ug_programs",
        "top_pg_programs",
        "features",
        "entry_roles",
        "required_subjects",
        "specialization",
    }
)


def _decode_json_string(value: Any) -> Any:
    """Decode JSON arrays or objects stored inside legacy text fields."""

    current = value

    for _ in range(2):
        if not isinstance(current, str):
            break

        candidate = current.strip()

        if not candidate or candidate[0] not in "[{":
            break

        try:
            current = json.loads(candidate)
        except json.JSONDecodeError:
            break

    return current


def _normalize_legacy_placeholders(value: Any) -> Any:
    """Convert legacy literal null strings into real JSON null values."""

    if isinstance(value, str) and value.strip().lower() == "null":
        return None

    if isinstance(value, list):
        return [
            _normalize_legacy_placeholders(item)
            for item in value
        ]

    if isinstance(value, dict):
        return {
            key: _normalize_legacy_placeholders(item)
            for key, item in value.items()
        }

    return value


def normalize_catalog_item(item: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(item)

    for field in JSON_ENCODED_FIELDS:
        if field in normalized:
            normalized[field] = _decode_json_string(
                normalized[field],
            )

    return {
        key: _normalize_legacy_placeholders(value)
        for key, value in normalized.items()
    }


class CatalogRepository(Protocol):
    async def summary(self) -> dict[str, Any]: ...
    async def list_countries(self) -> list[dict[str, Any]]: ...
    async def list_universities(
        self,
        **filters: Any,
    ) -> tuple[list[dict[str, Any]], int]: ...
    async def get_university(
        self,
        slug: str,
    ) -> dict[str, Any] | None: ...
    async def list_programmes(
        self,
        **filters: Any,
    ) -> tuple[list[dict[str, Any]], int]: ...
    async def get_programme(
        self,
        slug: str,
    ) -> dict[str, Any] | None: ...


class JsonCatalogRepository:
    """Local test and development catalogue repository."""

    def __init__(self, catalog_path: Path) -> None:
        self.catalog_path = catalog_path
        self._catalog = self._load(catalog_path)

    @staticmethod
    @lru_cache(maxsize=4)
    def _load(path: Path) -> dict[str, Any]:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    async def summary(self) -> dict[str, Any]:
        return {
            "institutions": len(
                self._catalog["universities"],
            ),
            "programmes": len(
                self._catalog["programmes"],
            ),
            "countries": len(
                self._catalog["countries"],
            ),
            "subjects": len(
                self._catalog["subjects"],
            ),
            "source": self._catalog.get(
                "generatedFrom",
                "legacy catalogue",
            ),
        }

    async def list_countries(
        self,
    ) -> list[dict[str, Any]]:
        return self._catalog["countries"]

    async def list_universities(
        self,
        **filters: Any,
    ) -> tuple[list[dict[str, Any]], int]:
        rows = self._catalog["universities"]
        query = str(
            filters.get("query") or "",
        ).strip().lower()
        country = str(
            filters.get("country") or "",
        ).strip().lower()
        scholarship = bool(
            filters.get("scholarship"),
        )

        if query:
            rows = [
                row
                for row in rows
                if query
                in " ".join(
                    [
                        row["name"],
                        row.get("abbreviation", ""),
                        row.get("city", ""),
                        row.get("country", ""),
                    ],
                ).lower()
            ]

        if country:
            rows = [
                row
                for row in rows
                if row.get("countrySlug") == country
            ]

        if scholarship:
            rows = [
                row
                for row in rows
                if row.get("scholarships")
            ]

        total = len(rows)
        offset = max(
            0,
            int(filters.get("offset") or 0),
        )
        limit = min(
            100,
            max(
                1,
                int(filters.get("limit") or 24),
            ),
        )

        return rows[offset : offset + limit], total

    async def get_university(
        self,
        slug: str,
    ) -> dict[str, Any] | None:
        return next(
            (
                row
                for row in self._catalog["universities"]
                if row["slug"] == slug
            ),
            None,
        )

    async def list_programmes(
        self,
        **filters: Any,
    ) -> tuple[list[dict[str, Any]], int]:
        rows = self._catalog["programmes"]
        query = str(
            filters.get("query") or "",
        ).strip().lower()
        country = str(
            filters.get("country") or "",
        ).strip().lower()
        subject = str(
            filters.get("subject") or "",
        ).strip().lower()
        level = str(
            filters.get("level") or "",
        ).strip().lower()
        university_slug = str(
            filters.get("university_slug") or "",
        ).strip().lower()

        if query:
            rows = [
                row
                for row in rows
                if query
                in " ".join(
                    [
                        row["name"],
                        row.get("universityName", ""),
                        row.get("subject", ""),
                        row.get("city", ""),
                    ],
                ).lower()
            ]

        if country:
            rows = [
                row
                for row in rows
                if row.get("countrySlug") == country
            ]

        if subject:
            rows = [
                row
                for row in rows
                if row.get(
                    "subject",
                    "",
                ).lower()
                == subject
            ]

        if level:
            rows = [
                row
                for row in rows
                if row.get(
                    "levelCode",
                    "",
                ).lower()
                == level
            ]

        if university_slug:
            rows = [
                row
                for row in rows
                if row.get("universitySlug")
                == university_slug
            ]

        total = len(rows)
        offset = max(
            0,
            int(filters.get("offset") or 0),
        )
        limit = min(
            100,
            max(
                1,
                int(filters.get("limit") or 24),
            ),
        )

        return rows[offset : offset + limit], total

    async def get_programme(
        self,
        slug: str,
    ) -> dict[str, Any] | None:
        return next(
            (
                row
                for row in self._catalog["programmes"]
                if row["slug"] == slug
            ),
            None,
        )


class PostgresCatalogRepository:
    """Production catalogue backed by Supabase PostgreSQL."""

    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def summary(self) -> dict[str, Any]:
        statement = text(
            """
            select
              (
                select count(*)
                from public.universities
                where publication_status = 'published'
              )::integer as institutions,
              (
                select count(*)
                from public.programmes
                where publication_status = 'published'
              )::integer as programmes,
              (
                select count(*)
                from public.countries
              )::integer as countries,
              9::integer as subjects
            """
        )

        result = await self.session.execute(
            statement,
        )
        row = result.mappings().one()

        return {
            "institutions": row["institutions"],
            "programmes": row["programmes"],
            "countries": row["countries"],
            "subjects": row["subjects"],
            "source": "Supabase PostgreSQL",
        }

    async def list_countries(
        self,
    ) -> list[dict[str, Any]]:
        statement = text(
            """
            select
              id,
              name,
              slug,
              iso2,
              iso3,
              region,
              currency_code
            from public.countries
            order by name
            """
        )

        result = await self.session.execute(
            statement,
        )

        return [
            dict(row)
            for row in result.mappings().all()
        ]

    async def list_universities(
        self,
        **filters: Any,
    ) -> tuple[list[dict[str, Any]], int]:
        query = str(
            filters.get("query") or "",
        ).strip()
        country = str(
            filters.get("country") or "",
        ).strip().lower()
        scholarship = bool(
            filters.get("scholarship"),
        )
        offset = max(
            0,
            int(filters.get("offset") or 0),
        )
        limit = min(
            100,
            max(
                1,
                int(filters.get("limit") or 24),
            ),
        )

        parameters = {
            "query": query,
            "country": country,
            "scholarship": scholarship,
            "limit": limit,
            "offset": offset,
        }

        where_sql = """
          u.publication_status = 'published'
          and (
            :query = ''
            or concat_ws(
              ' ',
              u.name,
              u.abbreviation,
              city.name,
              country.name
            ) ilike '%' || :query || '%'
          )
          and (
            :country = ''
            or country.slug = :country
          )
          and (
            :scholarship = false
            or exists (
              select 1
              from public.university_scholarships s
              where s.university_id = u.id
            )
          )
        """

        count_statement = text(
            f"""
            select count(*)::integer
            from public.universities u
            join public.countries country
              on country.id = u.country_id
            left join public.cities city
              on city.id = u.primary_city_id
            where {where_sql}
            """
        )

        rows_statement = text(
            f"""
            select
              coalesce(
                u.legacy_payload,
                '{{}}'::jsonb
              )
              ||
              jsonb_strip_nulls(
                jsonb_build_object(
                  'id', u.legacy_id,
                  'name', u.name,
                  'slug', u.slug,
                  'abbreviation', u.abbreviation,
                  'website', u.website,
                  'applicationPortal',
                    u.application_portal,
                  'applicationFee',
                    u.application_fee,
                  'city', city.name,
                  'country', country.name,
                  'countrySlug', country.slug
                )
              ) as item
            from public.universities u
            join public.countries country
              on country.id = u.country_id
            left join public.cities city
              on city.id = u.primary_city_id
            where {where_sql}
            order by u.name
            limit :limit
            offset :offset
            """
        )

        total_result = await self.session.execute(
            count_statement,
            parameters,
        )
        total = total_result.scalar_one()

        rows_result = await self.session.execute(
            rows_statement,
            parameters,
        )

        rows = [
            normalize_catalog_item(dict(row["item"]))
            for row in rows_result.mappings().all()
        ]

        return rows, total

    async def get_university(
        self,
        slug: str,
    ) -> dict[str, Any] | None:
        statement = text(
            """
            select
              coalesce(
                u.legacy_payload,
                '{}'::jsonb
              )
              ||
              jsonb_strip_nulls(
                jsonb_build_object(
                  'id', u.legacy_id,
                  'name', u.name,
                  'slug', u.slug,
                  'abbreviation', u.abbreviation,
                  'website', u.website,
                  'applicationPortal',
                    u.application_portal,
                  'applicationFee',
                    u.application_fee,
                  'city', city.name,
                  'country', country.name,
                  'countrySlug', country.slug
                )
              ) as item
            from public.universities u
            join public.countries country
              on country.id = u.country_id
            left join public.cities city
              on city.id = u.primary_city_id
            where u.slug = :slug
              and u.publication_status = 'published'
            limit 1
            """
        )

        result = await self.session.execute(
            statement,
            {"slug": slug},
        )
        row = result.mappings().first()

        if not row:
            return None

        return normalize_catalog_item(dict(row["item"]))

    async def list_programmes(
        self,
        **filters: Any,
    ) -> tuple[list[dict[str, Any]], int]:
        query = str(
            filters.get("query") or "",
        ).strip()
        country = str(
            filters.get("country") or "",
        ).strip().lower()
        subject = str(
            filters.get("subject") or "",
        ).strip().lower()
        level = str(
            filters.get("level") or "",
        ).strip().lower()
        university_slug = str(
            filters.get("university_slug") or "",
        ).strip().lower()
        offset = max(
            0,
            int(filters.get("offset") or 0),
        )
        limit = min(
            100,
            max(
                1,
                int(filters.get("limit") or 24),
            ),
        )

        parameters = {
            "query": query,
            "country": country,
            "subject": subject,
            "level": level,
            "university_slug": university_slug,
            "limit": limit,
            "offset": offset,
        }

        subject_expression = """
          lower(
            coalesce(
              nullif(
                p.legacy_payload ->> 'subject',
                ''
              ),
              nullif(p.faculty, '')
            )
          )
        """

        where_sql = f"""
          p.publication_status = 'published'
          and u.publication_status = 'published'
          and (
            :query = ''
            or concat_ws(
              ' ',
              p.name,
              u.name,
              p.faculty,
              city.name
            ) ilike '%' || :query || '%'
          )
          and (
            :country = ''
            or country.slug = :country
          )
          and (
            :subject = ''
            or {subject_expression} = :subject
          )
          and (
            :level = ''
            or lower(level.code) = :level
          )
          and (
            :university_slug = ''
            or u.slug = :university_slug
          )
        """

        joins_sql = """
          from public.programmes p
          join public.universities u
            on u.id = p.university_id
          join public.countries country
            on country.id = u.country_id
          left join public.cities city
            on city.id = u.primary_city_id
          left join public.degree_levels level
            on level.id = p.degree_level_id
        """

        count_statement = text(
            f"""
            select count(*)::integer
            {joins_sql}
            where {where_sql}
            """
        )

        rows_statement = text(
            f"""
            select
              coalesce(
                p.legacy_payload,
                '{{}}'::jsonb
              )
              ||
              jsonb_strip_nulls(
                jsonb_build_object(
                  'id', p.legacy_id,
                  'name', p.name,
                  'slug', p.slug,
                  'universityName', u.name,
                  'universitySlug', u.slug,
                  'country', country.name,
                  'countrySlug', country.slug,
                  'city', city.name,
                  'subject',
                    coalesce(
                      nullif(
                        p.legacy_payload
                          ->> 'subject',
                        ''
                      ),
                      p.faculty
                    ),
                  'level', level.name,
                  'levelCode', level.code,
                  'faculty', p.faculty,
                  'duration', p.duration_text
                )
              ) as item
            {joins_sql}
            where {where_sql}
            order by p.name, u.name
            limit :limit
            offset :offset
            """
        )

        total_result = await self.session.execute(
            count_statement,
            parameters,
        )
        total = total_result.scalar_one()

        rows_result = await self.session.execute(
            rows_statement,
            parameters,
        )

        rows = [
            normalize_catalog_item(dict(row["item"]))
            for row in rows_result.mappings().all()
        ]

        return rows, total

    async def get_programme(
        self,
        slug: str,
    ) -> dict[str, Any] | None:
        statement = text(
            """
            select
              coalesce(
                p.legacy_payload,
                '{}'::jsonb
              )
              ||
              jsonb_strip_nulls(
                jsonb_build_object(
                  'id', p.legacy_id,
                  'name', p.name,
                  'slug', p.slug,
                  'universityName', u.name,
                  'universitySlug', u.slug,
                  'country', country.name,
                  'countrySlug', country.slug,
                  'city', city.name,
                  'subject',
                    coalesce(
                      nullif(
                        p.legacy_payload
                          ->> 'subject',
                        ''
                      ),
                      p.faculty
                    ),
                  'level', level.name,
                  'levelCode', level.code,
                  'faculty', p.faculty,
                  'duration', p.duration_text
                )
              ) as item
            from public.programmes p
            join public.universities u
              on u.id = p.university_id
            join public.countries country
              on country.id = u.country_id
            left join public.cities city
              on city.id = u.primary_city_id
            left join public.degree_levels level
              on level.id = p.degree_level_id
            where p.slug = :slug
              and p.publication_status = 'published'
              and u.publication_status = 'published'
            limit 1
            """
        )

        result = await self.session.execute(
            statement,
            {"slug": slug},
        )
        row = result.mappings().first()

        if not row:
            return None

        return normalize_catalog_item(dict(row["item"]))
