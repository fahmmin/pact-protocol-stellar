"""Negotiation routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from pact.api.metrics import METRICS
from pact.api.schemas import (
    NegotiationApprove,
    NegotiationRequest,
    NegotiationSessionStart,
)
from pact.db import get_negotiation_session
from pact.services.orchestration import (
    advance_negotiation_session,
    approve_negotiation_session,
    run_negotiation,
    start_negotiation_session,
)

router = APIRouter(prefix="/negotiate", tags=["negotiation"])


@router.post("")
def negotiate(req: NegotiationRequest):
    METRICS.record_negotiation()
    return run_negotiation(
        req.creator_id,
        req.brand_id,
        req.initial_offer,
        req.persona,
    )


@router.post("/session")
def negotiate_session_start(req: NegotiationSessionStart):
    METRICS.record_negotiation()
    return start_negotiation_session(
        req.creator_id,
        req.brand_id,
        req.payment_stroops,
        req.creator_stake_stroops,
        req.brand_stake_stroops,
        req.deadline_ts,
        req.kpi_threshold_bps,
        req.match_proposal_id,
        req.max_rounds,
    )


@router.get("/session/{session_id}")
def negotiate_session_get(session_id: int):
    session = get_negotiation_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": session}


@router.post("/session/{session_id}/round")
def negotiate_session_round(session_id: int):
    return advance_negotiation_session(session_id)


@router.post("/session/{session_id}/approve")
def negotiate_session_approve(session_id: int, req: NegotiationApprove):
    return approve_negotiation_session(session_id, req.party, req.approved)
