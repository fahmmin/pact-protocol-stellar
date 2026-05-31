"""Indexer sync routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from pact.api.deps import require_api_key
from pact.integrations.stellar.indexer_sync import run_full_sync

router = APIRouter(prefix="/indexer", tags=["indexer"])


@router.post("/sync")
def indexer_sync(_: None = Depends(require_api_key)):
    return run_full_sync()
