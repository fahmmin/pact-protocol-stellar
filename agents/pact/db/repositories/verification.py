"""Verification, compliance, and profile audit repositories."""

from __future__ import annotations

import time
from typing import Any

from pact.db.connection import get_conn


def submit_verification(
    agent_id: int,
    wallet: str,
    platform: str,
    handle: str,
    proof_url: str,
    notes: str | None,
    idempotency_key: str | None,
) -> dict[str, Any]:
    with get_conn() as conn:
        if idempotency_key:
            existing = conn.execute(
                "SELECT * FROM verification_requests WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone()
            if existing:
                return dict(existing)

        cur = conn.execute(
            """
            INSERT INTO verification_requests
            (agent_id, wallet, platform, handle, proof_url, notes, status, created_at, idempotency_key)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            """,
            (agent_id, wallet, platform, handle, proof_url, notes, time.time(), idempotency_key),
        )
        row = conn.execute(
            "SELECT * FROM verification_requests WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def list_verification_requests(status: str | None = None) -> list[dict[str, Any]]:
    with get_conn() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM verification_requests WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM verification_requests ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


def review_verification(request_id: int, approved: bool, reviewer_notes: str) -> dict[str, Any]:
    status = "approved" if approved else "rejected"
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE verification_requests
            SET status = ?, reviewer_notes = ?, reviewed_at = ?
            WHERE id = ?
            """,
            (status, reviewer_notes, time.time(), request_id),
        )
        row = conn.execute(
            "SELECT * FROM verification_requests WHERE id = ?", (request_id,)
        ).fetchone()
        return dict(row)


def record_daily_check(
    deal_id: int,
    engagement_bps: int,
    likes: int,
    views: int,
    kpi_met: bool,
    notes: str | None,
) -> dict[str, Any]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO daily_metric_checks
            (deal_id, engagement_bps, likes, views, kpi_met, notes, checked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (deal_id, engagement_bps, likes, views, int(kpi_met), notes, time.time()),
        )
        row = conn.execute(
            "SELECT * FROM daily_metric_checks WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def get_daily_checks(deal_id: int) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM daily_metric_checks WHERE deal_id = ? ORDER BY checked_at DESC",
            (deal_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def add_compliance_action(deal_id: int, level: str, actor: str, message: str) -> dict[str, Any]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO compliance_actions (deal_id, level, actor, message, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (deal_id, level, actor, message, time.time()),
        )
        row = conn.execute(
            "SELECT * FROM compliance_actions WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def get_compliance_actions(deal_id: int) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM compliance_actions WHERE deal_id = ? ORDER BY created_at DESC",
            (deal_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def log_profile_change(agent_id: int, field: str, old_value: str, new_value: str) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO profile_audit (agent_id, field, old_value, new_value, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (agent_id, field, old_value, new_value, time.time()),
        )


def get_profile_audit(agent_id: int, limit: int = 10) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM profile_audit WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?",
            (agent_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]
