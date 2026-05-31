"""Indexed chain state repositories."""

from __future__ import annotations

import time
from typing import Any

from pact.db.connection import get_conn


def upsert_indexed_agent(profile: dict[str, Any]) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO indexed_agents (
                agent_id, wallet, agent_type, handle, platform, follower_count,
                verified, tier, avg_engagement_bps, total_deals, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(agent_id) DO UPDATE SET
                wallet=excluded.wallet, agent_type=excluded.agent_type,
                handle=excluded.handle, platform=excluded.platform,
                follower_count=excluded.follower_count, verified=excluded.verified,
                tier=excluded.tier, avg_engagement_bps=excluded.avg_engagement_bps,
                total_deals=excluded.total_deals, synced_at=excluded.synced_at
            """,
            (
                profile["agent_id"],
                profile.get("wallet", ""),
                profile.get("agent_type", "Creator"),
                profile.get("handle", ""),
                profile.get("platform", ""),
                int(profile.get("follower_count") or 0),
                int(profile.get("verified") or 0),
                int(profile.get("tier") or 0),
                int(profile.get("avg_engagement_bps") or 0),
                int(profile.get("total_deals") or 0),
                time.time(),
            ),
        )


def upsert_indexed_deal(deal: dict[str, Any]) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO indexed_deals (
                deal_id, creator_agent_id, brand_agent_id, status,
                creator_wallet, brand_wallet, deadline, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(deal_id) DO UPDATE SET
                creator_agent_id=excluded.creator_agent_id,
                brand_agent_id=excluded.brand_agent_id,
                status=excluded.status,
                creator_wallet=excluded.creator_wallet,
                brand_wallet=excluded.brand_wallet,
                deadline=excluded.deadline,
                synced_at=excluded.synced_at
            """,
            (
                deal["deal_id"],
                deal["creator_agent_id"],
                deal["brand_agent_id"],
                deal["status"],
                deal.get("creator_wallet", ""),
                deal.get("brand_wallet", ""),
                int(deal.get("deadline") or 0),
                time.time(),
            ),
        )


def search_indexed_agents(
    agent_type: str | None = None,
    platform: str | None = None,
    verified_only: bool = False,
    min_followers: int | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if agent_type:
        clauses.append("agent_type = ?")
        params.append(agent_type)
    if platform:
        clauses.append("LOWER(platform) = LOWER(?)")
        params.append(platform)
    if verified_only:
        clauses.append("verified = 1")
    if min_followers is not None:
        clauses.append("follower_count >= ?")
        params.append(min_followers)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    params.append(limit)
    with get_conn() as conn:
        rows = conn.execute(
            f"""
            SELECT * FROM indexed_agents {where}
            ORDER BY tier DESC, avg_engagement_bps DESC, follower_count DESC
            LIMIT ?
            """,
            params,
        ).fetchall()
        return [dict(r) for r in rows]


def get_indexed_deals_for_agent(agent_id: int) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT * FROM indexed_deals
            WHERE creator_agent_id = ? OR brand_agent_id = ?
            ORDER BY deal_id DESC
            """,
            (agent_id, agent_id),
        ).fetchall()
        return [dict(r) for r in rows]


def list_indexed_deals(limit: int = 50) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM indexed_deals ORDER BY deal_id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]
