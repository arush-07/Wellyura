from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_catalog_service
from app.schemas.catalog import CatalogSummary, PaginatedResponse, PaginationMeta, SearchResponse
from app.services.catalog import CatalogService

router = APIRouter(tags=["Catalogue"])


@router.get("/catalog/summary", response_model=CatalogSummary)
async def catalog_summary(service: CatalogService = Depends(get_catalog_service)):
    return service.summary()


@router.get("/countries")
async def list_countries(service: CatalogService = Depends(get_catalog_service)) -> list[dict[str, Any]]:
    return service.countries()


@router.get("/universities", response_model=PaginatedResponse)
async def list_universities(
    q: str = Query("", max_length=120),
    country: str = Query("", max_length=80),
    scholarship: bool = False,
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: CatalogService = Depends(get_catalog_service),
):
    data, total = service.universities(query=q, country=country, scholarship=scholarship, limit=limit, offset=offset)
    return PaginatedResponse(data=data, meta=PaginationMeta(total=total, limit=limit, offset=offset))


@router.get("/universities/{slug}")
async def get_university(slug: str, service: CatalogService = Depends(get_catalog_service)):
    return service.university(slug)


@router.get("/programmes", response_model=PaginatedResponse)
async def list_programmes(
    q: str = Query("", max_length=160),
    country: str = Query("", max_length=80),
    subject: str = Query("", max_length=120),
    level: str = Query("", max_length=30),
    university: str = Query("", max_length=180),
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: CatalogService = Depends(get_catalog_service),
):
    data, total = service.programmes(query=q, country=country, subject=subject, level=level, university_slug=university, limit=limit, offset=offset)
    return PaginatedResponse(data=data, meta=PaginationMeta(total=total, limit=limit, offset=offset))


@router.get("/programmes/{slug}")
async def get_programme(slug: str, service: CatalogService = Depends(get_catalog_service)):
    return service.programme(slug)


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=2, max_length=120),
    limit: int = Query(8, ge=1, le=20),
    service: CatalogService = Depends(get_catalog_service),
):
    return service.search(q, limit)
