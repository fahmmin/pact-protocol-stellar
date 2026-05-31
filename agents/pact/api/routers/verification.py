"""Verification routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from pact.api.deps import require_api_key
from pact.api.schemas import VerificationReview, VerificationSubmit
from pact.db import list_verification_requests, review_verification, submit_verification
from pact.services.stellar_ops import verification_on_chain_action

router = APIRouter(prefix="/verification", tags=["verification"])


@router.post("/submit")
def verification_submit(
    req: VerificationSubmit,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    row = submit_verification(
        agent_id=req.agent_id,
        wallet=req.wallet,
        platform=req.platform,
        handle=req.handle,
        proof_url=req.proof_url,
        notes=req.notes,
        idempotency_key=idempotency_key,
    )
    return {"status": "submitted", "request": row}


@router.get("/requests")
def verification_list(
    status: str | None = None,
    _: None = Depends(require_api_key),
):
    return {"requests": list_verification_requests(status)}


@router.get("/status/{agent_id}")
def verification_status(agent_id: int):
    rows = [r for r in list_verification_requests() if r["agent_id"] == agent_id]
    latest = rows[0] if rows else None
    return {"agent_id": agent_id, "latest_request": latest}


@router.post("/review/{request_id}")
def verification_review(
    request_id: int,
    req: VerificationReview,
    _: None = Depends(require_api_key),
):
    row = review_verification(request_id, req.approved, req.reviewer_notes)
    on_chain = verification_on_chain_action(int(row["agent_id"]), req.approved)
    return {
        "status": row["status"],
        "request": row,
        "on_chain_action": on_chain,
    }
