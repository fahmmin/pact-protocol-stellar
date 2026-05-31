"""Admin prompt routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from pact.api.deps import require_api_key
from pact.api.schemas import PromptUpsert
from pact.db import get_active_prompt, list_prompts, upsert_prompt

router = APIRouter(prefix="/admin/prompts", tags=["admin"])


@router.get("")
def admin_list_prompts(_: None = Depends(require_api_key)):
    return {"prompts": list_prompts()}


@router.get("/{persona_id}")
def admin_get_active_prompt(persona_id: str):
    template = get_active_prompt(persona_id)
    if not template:
        raise HTTPException(status_code=404, detail="No active prompt for persona")
    return template


@router.put("")
def admin_upsert_prompt(req: PromptUpsert, _: None = Depends(require_api_key)):
    row = upsert_prompt(
        req.template_id,
        req.persona_id,
        req.system_prompt,
        req.constraints,
        req.activate,
    )
    return {"prompt": row}
