from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWTError

from app.core.config import get_settings

ALLOWED_JWT_ALGORITHMS = ("ES256",)
REQUIRED_JWT_CLAIMS = (
    "iss",
    "aud",
    "exp",
    "iat",
    "sub",
    "role",
)

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    id: str
    email: str | None
    role: str
    claims: dict[str, Any]


class SupabaseJWTVerifier:
    """Verify Supabase access tokens using the project's public JWKS."""

    def __init__(
        self,
        *,
        supabase_url: str,
        jwks_url: str = "",
        audience: str = "authenticated",
    ) -> None:
        base_url = supabase_url.strip().rstrip("/")

        if not base_url:
            raise RuntimeError(
                "WELLYURA_SUPABASE_URL must be configured."
            )

        self.issuer = f"{base_url}/auth/v1"
        self.audience = audience
        self.jwks_url = (
            jwks_url.strip()
            or f"{self.issuer}/.well-known/jwks.json"
        )
        self.jwks_client = PyJWKClient(self.jwks_url)

    def verify(self, token: str) -> AuthenticatedUser:
        header = jwt.get_unverified_header(token)

        if header.get("alg") not in ALLOWED_JWT_ALGORITHMS:
            raise InvalidTokenError(
                "Unsupported JWT signing algorithm."
            )

        signing_key = self.jwks_client.get_signing_key_from_jwt(
            token,
        )

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=list(ALLOWED_JWT_ALGORITHMS),
            audience=self.audience,
            issuer=self.issuer,
            options={
                "require": list(REQUIRED_JWT_CLAIMS),
            },
        )

        if claims.get("role") != "authenticated":
            raise InvalidTokenError(
                "An authenticated user token is required."
            )

        return AuthenticatedUser(
            id=str(claims["sub"]),
            email=claims.get("email"),
            role=str(claims["role"]),
            claims=claims,
        )


@lru_cache
def get_jwt_verifier() -> SupabaseJWTVerifier:
    settings = get_settings()

    return SupabaseJWTVerifier(
        supabase_url=settings.supabase_url,
        jwks_url=settings.supabase_jwks_url,
        audience=settings.supabase_jwt_audience,
    )


def unauthorized_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="A valid Supabase access token is required.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme,
    ),
) -> AuthenticatedUser:
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials
    ):
        raise unauthorized_exception()

    verifier = get_jwt_verifier()

    try:
        return await run_in_threadpool(
            verifier.verify,
            credentials.credentials,
        )
    except PyJWTError as error:
        raise unauthorized_exception() from error
