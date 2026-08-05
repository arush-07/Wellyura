from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class PaginationMeta(BaseModel):
    total: int
    limit: int
    offset: int


class PaginatedResponse(BaseModel):
    data: list[dict[str, Any]]
    meta: PaginationMeta


class SearchResponse(BaseModel):
    universities: list[dict[str, Any]] = Field(default_factory=list)
    programmes: list[dict[str, Any]] = Field(default_factory=list)
    countries: list[dict[str, Any]] = Field(default_factory=list)
    query: str = ""


class CatalogSummary(BaseModel):
    institutions: int
    programmes: int
    countries: int
    subjects: int
    source: str
