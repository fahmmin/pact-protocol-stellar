"""Profile audit routes."""

from __future__ import annotations

from fastapi import APIRouter

from pact.api.schemas import ProfileAuditLog
from pact.db import get_profile_audit, log_profile_change

router = APIRouter(prefix="/profile/audit", tags=["profile"])


@router.post("")
def profile_audit_log(req: ProfileAuditLog):
    log_profile_change(req.agent_id, req.field, req.old_value, req.new_value)
    return {"status": "logged"}


@router.get("/{agent_id}")
def profile_audit_get(agent_id: int):
    return {"audit": get_profile_audit(agent_id)}
