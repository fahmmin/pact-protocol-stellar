"""API authentication dependencies."""

from __future__ import annotations

from fastapi import Header, HTTPException

from pact.config import get_settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = get_settings().oracle_api_key
    if not expected:
        return
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")
