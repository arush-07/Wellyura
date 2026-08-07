from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_current_user
from app.schemas.auth import CurrentUserResponse

router = APIRouter(tags=["Authentication"])


@router.get("/me", response_model=CurrentUserResponse)
async def current_user(
    user: AuthenticatedUser = Depends(get_current_user),
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        aal=user.claims.get("aal"),
        session_id=user.claims.get("session_id"),
        is_anonymous=bool(
            user.claims.get("is_anonymous", False)
        ),
    )
