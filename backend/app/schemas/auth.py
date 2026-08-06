from __future__ import annotations

from pydantic import BaseModel


class CurrentUserResponse(BaseModel):
    id: str
    email: str | None = None
    role: str
    aal: str | None = None
    session_id: str | None = None
    is_anonymous: bool = False
