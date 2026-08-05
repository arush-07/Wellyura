from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import DomainError

settings = get_settings()

app = FastAPI(
    title="Wellyura API",
    version="2.0.0",
    description="Domain API for Wellyura's university, programme and student-planning platform.",
    default_response_class=ORJSONResponse,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)
app.include_router(api_router, prefix=settings.api_prefix)


@app.exception_handler(DomainError)
async def domain_error_handler(_: Request, error: DomainError):
    return ORJSONResponse(
        status_code=error.status_code,
        content={"error": {"code": error.code, "message": error.message}},
    )


@app.get("/", include_in_schema=False)
async def root():
    return {"service": "Wellyura API", "version": "2.0.0", "docs": "/docs"}
