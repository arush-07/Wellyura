from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Liveness and migration-catalogue status")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "wellyura-api", "version": "2.0.0"}
