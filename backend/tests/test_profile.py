from __future__ import annotations

from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_profile_service
from app.core.auth import AuthenticatedUser, get_current_user
from app.main import app

client = TestClient(app)

USER_ID = UUID(
    "11111111-1111-1111-1111-111111111111"
)
COUNTRY_ID = UUID(
    "22222222-2222-2222-2222-222222222222"
)


async def authenticated_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=str(USER_ID),
        email="student@example.com",
        role="authenticated",
        claims={},
    )


def test_profile_requires_authentication() -> None:
    response = client.get("/api/v1/profile")

    assert response.status_code == 401


def test_get_profile_uses_authenticated_user() -> None:
    class FakeProfileService:
        async def get(
            self,
            *,
            user_id: UUID,
            email: str | None,
        ):
            assert user_id == USER_ID
            assert email == "student@example.com"

            return {
                "id": user_id,
                "email": email,
                "full_name": "Wellyura Student",
                "phone": "+91-9999999999",
                "preferred_country_id": COUNTRY_ID,
            }

    app.dependency_overrides[
        get_current_user
    ] = authenticated_user

    app.dependency_overrides[
        get_profile_service
    ] = lambda: FakeProfileService()

    try:
        response = client.get("/api/v1/profile")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "id": str(USER_ID),
        "email": "student@example.com",
        "full_name": "Wellyura Student",
        "phone": "+91-9999999999",
        "preferred_country_id": str(COUNTRY_ID),
    }


def test_patch_profile_uses_jwt_user_id() -> None:
    class FakeProfileService:
        async def update(
            self,
            *,
            user_id: UUID,
            email: str | None,
            payload,
        ):
            assert user_id == USER_ID
            assert email == "student@example.com"
            assert payload.full_name == "Updated Student"
            assert payload.phone == "+91-8888888888"
            assert payload.preferred_country_id == COUNTRY_ID

            return {
                "id": user_id,
                "email": email,
                "full_name": payload.full_name,
                "phone": payload.phone,
                "preferred_country_id": (
                    payload.preferred_country_id
                ),
            }

    app.dependency_overrides[
        get_current_user
    ] = authenticated_user

    app.dependency_overrides[
        get_profile_service
    ] = lambda: FakeProfileService()

    try:
        response = client.patch(
            "/api/v1/profile",
            json={
                "full_name": "Updated Student",
                "phone": "+91-8888888888",
                "preferred_country_id": str(
                    COUNTRY_ID
                ),
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["id"] == str(USER_ID)
    assert response.json()["full_name"] == (
        "Updated Student"
    )


def test_patch_profile_rejects_invalid_country() -> None:
    class FakeProfileService:
        async def update(self, **kwargs):
            raise ValueError(
                "Preferred country does not exist."
            )

    app.dependency_overrides[
        get_current_user
    ] = authenticated_user

    app.dependency_overrides[
        get_profile_service
    ] = lambda: FakeProfileService()

    try:
        response = client.patch(
            "/api/v1/profile",
            json={
                "full_name": "Student",
                "preferred_country_id": str(
                    COUNTRY_ID
                ),
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Preferred country does not exist."
    )


def test_patch_profile_rejects_client_user_identity() -> None:
    app.dependency_overrides[
        get_current_user
    ] = authenticated_user

    try:
        response = client.patch(
            "/api/v1/profile",
            json={
                "full_name": "Student",
                "user_id": (
                    "99999999-9999-9999-9999-999999999999"
                ),
                "id": (
                    "99999999-9999-9999-9999-999999999999"
                ),
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422

    error_locations = [
        tuple(error["loc"])
        for error in response.json()["detail"]
    ]

    assert ("body", "user_id") in error_locations
    assert ("body", "id") in error_locations
