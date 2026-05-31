"""Settlement review repositories."""

from __future__ import annotations

import time
from typing import Any

from pact.db.repositories.verification import get_daily_checks
from pact.db.connection import get_conn


def create_settlement_review(
    deal_id: int,
    engagement_bps: int,
    likes: int,
    views: int,
    success: bool,
    reviewer_notes: str | None = None,
) -> dict[str, Any]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO settlement_reviews
            (deal_id, engagement_bps, likes, views, success, status, reviewer_notes, created_at)
            VALUES (?, ?, ?, ?, ?, 'approved', ?, ?)
            """,
            (
                deal_id,
                engagement_bps,
                likes,
                views,
                int(success),
                reviewer_notes,
                time.time(),
            ),
        )
        row = conn.execute(
            "SELECT * FROM settlement_reviews WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def list_settlement_reviews(status: str | None = None) -> list[dict[str, Any]]:
    with get_conn() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM settlement_reviews WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM settlement_reviews ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


def get_settlement_readiness(deal_id: int, threshold_bps: int = 500) -> dict[str, Any]:
    checks = get_daily_checks(deal_id)
    if not checks:
        return {"deal_id": deal_id, "badge": "Not Ready", "latest": None}
    latest = checks[0]
    if latest["kpi_met"]:
        return {"deal_id": deal_id, "badge": "Ready", "latest": latest}
    return {"deal_id": deal_id, "badge": "Under Review", "latest": latest, "threshold_bps": threshold_bps}
