from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class DomainError(Exception):
    code: str
    message: str
    status_code: int = 400


class NotFoundError(DomainError):
    def __init__(self, entity: str, identifier: str) -> None:
        super().__init__(
            code="not_found",
            message=f"{entity} '{identifier}' was not found.",
            status_code=404,
        )
