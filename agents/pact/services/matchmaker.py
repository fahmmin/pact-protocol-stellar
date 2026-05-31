"""Matchmaker: search indexed profiles and propose creator-brand pairings."""

from __future__ import annotations

from typing import Any

from pact.db import (
    create_match_proposal,
    get_match_proposal,
    list_match_proposals,
    search_indexed_agents,
    update_match_proposal_status,
)
from pact.integrations.llm import generate_terms_summary


def score_creator_for_brand(
    brand: dict[str, Any],
    creator: dict[str, Any],
    platform_filter: str | None = None,
) -> tuple[float, str]:
    score = 0.0
    reasons: list[str] = []

    if creator.get("agent_type") != "Creator":
        return 0.0, "Not a creator profile"

    if platform_filter and creator.get("platform", "").lower() != platform_filter.lower():
        return 0.0, f"Platform mismatch (want {platform_filter})"

    if creator.get("verified"):
        score += 30
        reasons.append("verified creator")
    else:
        score += 10
        reasons.append("unverified creator (lower cap deals)")

    followers = int(creator.get("follower_count") or 0)
    if followers >= 100_000:
        score += 25
        reasons.append("100k+ followers")
    elif followers >= 10_000:
        score += 15
        reasons.append("10k+ followers")
    elif followers >= 1_000:
        score += 8
        reasons.append("1k+ followers")

    tier = int(creator.get("tier") or 0)
    score += tier * 10
    if tier:
        reasons.append(f"reputation tier {tier}")

    engagement = int(creator.get("avg_engagement_bps") or 0)
    if engagement >= 500:
        score += 20
        reasons.append(f"strong engagement ({engagement} bps)")
    elif engagement > 0:
        score += engagement / 50
        reasons.append(f"engagement {engagement} bps")

    total_deals = int(creator.get("total_deals") or 0)
    if total_deals:
        score += min(total_deals * 2, 20)
        reasons.append(f"{total_deals} past deals")

    rationale = "; ".join(reasons) if reasons else "baseline fit"
    return round(score, 2), rationale


def search_agents(
    agent_type: str | None = None,
    platform: str | None = None,
    verified_only: bool = False,
    min_followers: int | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    return search_indexed_agents(
        agent_type=agent_type,
        platform=platform,
        verified_only=verified_only,
        min_followers=min_followers,
        limit=limit,
    )


def propose_matches(
    brand_agent_id: int,
    platform: str | None = None,
    min_followers: int | None = None,
    limit: int = 5,
    use_llm_rationale: bool = True,
) -> list[dict[str, Any]]:
    brands = search_indexed_agents(agent_type="Brand", limit=1)
    brand = next((b for b in brands if int(b["agent_id"]) == brand_agent_id), None)
    if not brand:
        brand = {"agent_id": brand_agent_id, "handle": str(brand_agent_id), "platform": ""}

    creators = search_indexed_agents(
        agent_type="Creator",
        platform=platform,
        min_followers=min_followers,
        limit=50,
    )

    scored: list[tuple[float, str, dict[str, Any]]] = []
    for creator in creators:
        if int(creator["agent_id"]) == brand_agent_id:
            continue
        score, rationale = score_creator_for_brand(brand, creator, platform)
        if score > 0:
            scored.append((score, rationale, creator))

    scored.sort(key=lambda x: x[0], reverse=True)
    proposals: list[dict[str, Any]] = []

    for score, rationale, creator in scored[:limit]:
        final_rationale = rationale
        if use_llm_rationale:
            llm = generate_terms_summary(
                "You are a sponsorship matchmaker. Explain fit in one sentence.",
                f"Brand {brand.get('handle')} (id {brand_agent_id}) and creator "
                f"{creator.get('handle')} on {creator.get('platform')} "
                f"with {creator.get('follower_count')} followers. Score factors: {rationale}",
            )
            if llm:
                final_rationale = llm

        row = create_match_proposal(
            brand_agent_id=brand_agent_id,
            creator_agent_id=int(creator["agent_id"]),
            score=score,
            rationale=final_rationale,
        )
        proposals.append(row)

    return proposals


def accept_match(proposal_id: int) -> dict[str, Any]:
    proposal = get_match_proposal(proposal_id)
    if not proposal:
        return {"status": "error", "detail": "proposal not found"}
    if proposal["status"] != "pending":
        return {"status": "error", "detail": f"proposal already {proposal['status']}"}
    updated = update_match_proposal_status(proposal_id, "accepted")
    return {"status": "accepted", "proposal": updated}


def reject_match(proposal_id: int) -> dict[str, Any]:
    proposal = get_match_proposal(proposal_id)
    if not proposal:
        return {"status": "error", "detail": "proposal not found"}
    updated = update_match_proposal_status(proposal_id, "rejected")
    return {"status": "rejected", "proposal": updated}


def list_proposals(
    brand_agent_id: int | None = None,
    creator_agent_id: int | None = None,
    status: str | None = "pending",
) -> list[dict[str, Any]]:
    return list_match_proposals(
        brand_agent_id=brand_agent_id,
        creator_agent_id=creator_agent_id,
        status=status,
    )
