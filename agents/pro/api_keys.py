"""Pro tier API key authentication."""

from __future__ import annotations

import os
import secrets
from typing import Callable

from fastapi import Header, HTTPException, Request


def require_pro_api_key(
    x_pro_api_key: str | None = Header(default=None, alias="X-Pro-API-Key"),
) -> None:
    expected = os.environ.get("PRO_API_KEY", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Pro API keys not configured")
    if x_pro_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Pro-API-Key")


def generate_api_key() -> str:
    return secrets.token_urlsafe(32)
