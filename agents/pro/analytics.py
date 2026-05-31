"""Pro analytics aggregation endpoints."""

from __future__ import annotations

from typing import Any

from pact.db import get_daily_checks, list_indexed_deals, list_settlement_reviews
from pact.db.repositories.indexing import search_indexed_agents


def get_deal_analytics(limit: int = 50) -> dict[str, Any]:
    deals = list_indexed_deals(limit)
    enriched = []
    for deal in deals:
        deal_id = int(deal["deal_id"])
        checks = get_daily_checks(deal_id)
        enriched.append(
            {
                **deal,
                "check_count": len(checks),
                "latest_engagement_bps": checks[0]["engagement_bps"] if checks else None,
            }
        )
    return {"deals": enriched, "total": len(enriched)}


def get_platform_summary() -> dict[str, Any]:
    agents = search_indexed_agents(limit=500)
    by_platform: dict[str, int] = {}
    verified = 0
    for agent in agents:
        platform = agent.get("platform") or "unknown"
        by_platform[platform] = by_platform.get(platform, 0) + 1
        if agent.get("verified"):
            verified += 1
    reviews = list_settlement_reviews()
    return {
        "agent_count": len(agents),
        "verified_agents": verified,
        "agents_by_platform": by_platform,
        "settlement_reviews": len(reviews),
    }
