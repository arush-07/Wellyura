from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileResponse(BaseModel):
    id: UUID
    email: str | None = None
    full_name: str | None = None
    phone: str | None = None
    preferred_country_id: UUID | None = None


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=40)
    preferred_country_id: UUID | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Full name cannot be empty.")

        return cleaned

    @field_validator("phone")
    @classmethod
    def clean_phone(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None
