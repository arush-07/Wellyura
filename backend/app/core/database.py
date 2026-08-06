from __future__ import annotations

import ssl

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()


def normalize_database_url(database_url: str) -> str:
    """Ensure SQLAlchemy uses the asynchronous asyncpg driver."""

    if database_url.startswith("postgres://"):
        return database_url.replace(
            "postgres://",
            "postgresql+asyncpg://",
            1,
        )

    if database_url.startswith("postgresql://"):
        return database_url.replace(
            "postgresql://",
            "postgresql+asyncpg://",
            1,
        )

    return database_url


def create_database_engine() -> AsyncEngine:
    database_url = normalize_database_url(
        settings.database_url,
    )

    engine_options = {
        "pool_pre_ping": True,
        "pool_size": settings.database_pool_size,
        "max_overflow": settings.database_max_overflow,
        "pool_timeout": settings.database_pool_timeout_seconds,
        "pool_recycle": (
            settings.database_pool_recycle_seconds
        ),
    }

    is_supabase = (
        "supabase.co" in database_url
        or "pooler.supabase.com" in database_url
    )

    if settings.env.lower() == "production" or is_supabase:
        engine_options["connect_args"] = {
            "ssl": ssl.create_default_context(),
        }

    return create_async_engine(
        database_url,
        **engine_options,
    )


engine = create_database_engine()

SessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db_session():
    async with SessionLocal() as session:
        yield session
