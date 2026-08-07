from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_profile_service
from app.core.auth import AuthenticatedUser, get_current_user
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdateRequest,
)
from app.services.profile import ProfileService

router = APIRouter(tags=["Profile"])


@router.get(
    "/profile",
    response_model=ProfileResponse,
)
async def get_profile(
    user: AuthenticatedUser = Depends(
        get_current_user,
    ),
    service: ProfileService = Depends(
        get_profile_service,
    ),
) -> ProfileResponse:
    profile = await service.get(
        user_id=UUID(user.id),
        email=user.email,
    )

    return ProfileResponse.model_validate(
        profile,
    )


@router.patch(
    "/profile",
    response_model=ProfileResponse,
)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: AuthenticatedUser = Depends(
        get_current_user,
    ),
    service: ProfileService = Depends(
        get_profile_service,
    ),
) -> ProfileResponse:
    try:
        profile = await service.update(
            user_id=UUID(user.id),
            email=user.email,
            payload=payload,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error

    return ProfileResponse.model_validate(
        profile,
    )
