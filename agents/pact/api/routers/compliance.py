"""Compliance routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from pact.api.deps import require_api_key
from pact.api.schemas import ComplianceAction
from pact.db import add_compliance_action, get_compliance_actions

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.post("/actions")
def post_compliance(req: ComplianceAction, _: None = Depends(require_api_key)):
    row = add_compliance_action(req.deal_id, req.level, req.actor, req.message)
    return {"action": row}


@router.get("/actions/{deal_id}")
def list_compliance(deal_id: int):
    return {"actions": get_compliance_actions(deal_id)}
