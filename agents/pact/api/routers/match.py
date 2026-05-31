"""Matchmaker routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from pact.api.schemas import MatchProposeRequest
from pact.services.matchmaker import (
    accept_match,
    list_proposals,
    propose_matches,
    reject_match,
    search_agents,
)

router = APIRouter(tags=["match"])


@router.get("/agents/search")
def agents_search(
    agent_type: str | None = None,
    platform: str | None = None,
    verified_only: bool = False,
    min_followers: int | None = None,
    limit: int = 20,
):
    return {
        "agents": search_agents(
            agent_type=agent_type,
            platform=platform,
            verified_only=verified_only,
            min_followers=min_followers,
            limit=limit,
        )
    }


@router.post("/match/propose")
def match_propose(req: MatchProposeRequest):
    proposals = propose_matches(
        brand_agent_id=req.brand_agent_id,
        platform=req.platform,
        min_followers=req.min_followers,
        limit=req.limit,
    )
    return {"proposals": proposals}


@router.get("/match/proposals")
def match_proposals_list(
    brand_agent_id: int | None = None,
    creator_agent_id: int | None = None,
    status: str | None = "pending",
):
    return {
        "proposals": list_proposals(
            brand_agent_id=brand_agent_id,
            creator_agent_id=creator_agent_id,
            status=status,
        )
    }


@router.post("/match/{proposal_id}/accept")
def match_accept(proposal_id: int):
    result = accept_match(proposal_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("detail"))
    return result


@router.post("/match/{proposal_id}/reject")
def match_reject(proposal_id: int):
    result = reject_match(proposal_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("detail"))
    return result
