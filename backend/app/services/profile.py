from __future__ import annotations

from typing import Any
from uuid import UUID

from app.repositories.profile import ProfileRepository
from app.schemas.profile import ProfileUpdateRequest


class ProfileService:
    def __init__(
        self,
        repository: ProfileRepository,
    ) -> None:
        self.repository = repository

    async def get(
        self,
        *,
        user_id: UUID,
        email: str | None,
    ) -> dict[str, Any]:
        profile = await self.repository.get(user_id)

        if profile is None:
            return {
                "id": user_id,
                "email": email,
                "full_name": None,
                "phone": None,
                "preferred_country_id": None,
            }

        return {
            **profile,
            "email": email,
        }

    async def update(
        self,
        *,
        user_id: UUID,
        email: str | None,
        payload: ProfileUpdateRequest,
    ) -> dict[str, Any]:
        current = await self.repository.get(user_id)

        current = current or {
            "full_name": None,
            "phone": None,
            "preferred_country_id": None,
        }

        supplied_fields = payload.model_fields_set

        full_name = (
            payload.full_name
            if "full_name" in supplied_fields
            else current["full_name"]
        )

        phone = (
            payload.phone
            if "phone" in supplied_fields
            else current["phone"]
        )

        preferred_country_id = (
            payload.preferred_country_id
            if "preferred_country_id" in supplied_fields
            else current["preferred_country_id"]
        )

        if "full_name" in supplied_fields and full_name is None:
            raise ValueError(
                "Full name cannot be empty."
            )

        if preferred_country_id is not None:
            country_exists = (
                await self.repository.country_exists(
                    preferred_country_id,
                )
            )

            if not country_exists:
                raise ValueError(
                    "Preferred country does not exist."
                )

        profile = await self.repository.upsert(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            preferred_country_id=preferred_country_id,
        )

        return {
            **profile,
            "email": email,
        }
