from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class ProfileRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def get(
        self,
        user_id: UUID,
    ) -> dict[str, Any] | None:
        result = await self.session.execute(
            text(
                """
                select
                  id,
                  full_name,
                  phone,
                  preferred_country_id
                from public.profiles
                where id = :user_id
                limit 1
                """
            ),
            {
                "user_id": user_id,
            },
        )

        row = result.mappings().first()

        return dict(row) if row else None

    async def country_exists(
        self,
        country_id: UUID,
    ) -> bool:
        result = await self.session.execute(
            text(
                """
                select exists (
                  select 1
                  from public.countries
                  where id = :country_id
                )
                """
            ),
            {
                "country_id": country_id,
            },
        )

        return bool(result.scalar_one())

    async def upsert(
        self,
        *,
        user_id: UUID,
        full_name: str | None,
        phone: str | None,
        preferred_country_id: UUID | None,
    ) -> dict[str, Any]:
        result = await self.session.execute(
            text(
                """
                insert into public.profiles (
                  id,
                  full_name,
                  phone,
                  preferred_country_id
                )
                values (
                  :user_id,
                  :full_name,
                  :phone,
                  :preferred_country_id
                )
                on conflict (id)
                do update set
                  full_name = excluded.full_name,
                  phone = excluded.phone,
                  preferred_country_id =
                    excluded.preferred_country_id,
                  updated_at = now()
                returning
                  id,
                  full_name,
                  phone,
                  preferred_country_id
                """
            ),
            {
                "user_id": user_id,
                "full_name": full_name,
                "phone": phone,
                "preferred_country_id": preferred_country_id,
            },
        )

        await self.session.commit()

        return dict(result.mappings().one())
