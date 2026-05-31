"""Match proposal repositories."""

from __future__ import annotations

import time
from typing import Any

from pact.db.connection import get_conn


def create_match_proposal(
    brand_agent_id: int,
    creator_agent_id: int,
    score: float,
    rationale: str,
) -> dict[str, Any]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO match_proposals
            (brand_agent_id, creator_agent_id, score, rationale, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', ?)
            """,
            (brand_agent_id, creator_agent_id, score, rationale, time.time()),
        )
        row = conn.execute(
            "SELECT * FROM match_proposals WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def get_match_proposal(proposal_id: int) -> dict[str, Any] | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM match_proposals WHERE id = ?", (proposal_id,)
        ).fetchone()
        return dict(row) if row else None


def list_match_proposals(
    brand_agent_id: int | None = None,
    creator_agent_id: int | None = None,
    status: str | None = None,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if brand_agent_id is not None:
        clauses.append("brand_agent_id = ?")
        params.append(brand_agent_id)
    if creator_agent_id is not None:
        clauses.append("creator_agent_id = ?")
        params.append(creator_agent_id)
    if status:
        clauses.append("status = ?")
        params.append(status)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT * FROM match_proposals {where} ORDER BY created_at DESC",
            params,
        ).fetchall()
        return [dict(r) for r in rows]


def update_match_proposal_status(proposal_id: int, status: str) -> dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE match_proposals SET status = ?, responded_at = ? WHERE id = ?
            """,
            (status, time.time(), proposal_id),
        )
        row = conn.execute(
            "SELECT * FROM match_proposals WHERE id = ?", (proposal_id,)
        ).fetchone()
        return dict(row)
