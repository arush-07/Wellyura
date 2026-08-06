from __future__ import annotations

import jwt
import pytest
from fastapi.testclient import TestClient
from jwt.exceptions import InvalidTokenError

from app.core.auth import (
    AuthenticatedUser,
    SupabaseJWTVerifier,
    get_current_user,
)
from app.main import app

client = TestClient(app)


def test_me_requires_bearer_token() -> None:
    response = client.get("/api/v1/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_me_returns_authenticated_user() -> None:
    async def override_current_user() -> AuthenticatedUser:
        return AuthenticatedUser(
            id="11111111-1111-1111-1111-111111111111",
            email="student@example.com",
            role="authenticated",
            claims={
                "aal": "aal1",
                "session_id": "test-session",
                "is_anonymous": False,
            },
        )

    app.dependency_overrides[
        get_current_user
    ] = override_current_user

    try:
        response = client.get("/api/v1/me")
    finally:
        app.dependency_overrides.pop(
            get_current_user,
            None,
        )

    assert response.status_code == 200
    assert response.json() == {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "student@example.com",
        "role": "authenticated",
        "aal": "aal1",
        "session_id": "test-session",
        "is_anonymous": False,
    }


def test_verifier_rejects_hs256_tokens() -> None:
    verifier = SupabaseJWTVerifier(
        supabase_url="https://example.supabase.co",
    )

    token = jwt.encode(
        {
            "iss": "https://example.supabase.co/auth/v1",
            "aud": "authenticated",
            "sub": "11111111-1111-1111-1111-111111111111",
            "role": "authenticated",
            "iat": 1,
            "exp": 9999999999,
        },
        "test-secret-that-is-at-least-32-bytes-long",
        algorithm="HS256",
    )

    with pytest.raises(
        InvalidTokenError,
        match="Unsupported JWT signing algorithm",
    ):
        verifier.verify(token)

