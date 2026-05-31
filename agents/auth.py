"""API key authentication for admin/oracle endpoints."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = os.environ.get("ORACLE_API_KEY", "")
    if not expected:
        # Dev mode: allow if unset (testnet only)
        return
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")
