"""Negotiation session repositories."""

from __future__ import annotations

import json
import time
from typing import Any

from pact.db.connection import get_conn


def log_negotiation(
    creator_id: str,
    brand_id: str,
    persona_used: str,
    template_version: int | None,
    deal_intent_hash: str,
    terms_summary: str,
) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO negotiation_log
            (creator_id, brand_id, persona_used, template_version, deal_intent_hash, terms_summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                creator_id,
                brand_id,
                persona_used,
                template_version,
                deal_intent_hash,
                terms_summary,
                time.time(),
            ),
        )


def create_negotiation_session(
    creator_id: str,
    brand_id: str,
    deal_terms: dict[str, Any],
    deal_intent_hash: str,
    terms_summary: str,
    max_rounds: int = 4,
    match_proposal_id: int | None = None,
) -> dict[str, Any]:
    now = time.time()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO negotiation_sessions (
                creator_id, brand_id, status, deal_terms_json, deal_intent_hash,
                terms_summary, rounds, max_rounds, match_proposal_id, created_at, updated_at
            ) VALUES (?, ?, 'negotiating', ?, ?, ?, 0, ?, ?, ?, ?)
            """,
            (
                creator_id,
                brand_id,
                json.dumps(deal_terms),
                deal_intent_hash,
                terms_summary,
                max_rounds,
                match_proposal_id,
                now,
                now,
            ),
        )
        row = conn.execute(
            "SELECT * FROM negotiation_sessions WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def get_negotiation_session(session_id: int) -> dict[str, Any] | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM negotiation_sessions WHERE id = ?", (session_id,)
        ).fetchone()
        if not row:
            return None
        session = dict(row)
        rounds = conn.execute(
            """
            SELECT round_num, persona, message, created_at
            FROM negotiation_rounds WHERE session_id = ? ORDER BY round_num
            """,
            (session_id,),
        ).fetchall()
        session["rounds_history"] = [dict(r) for r in rounds]
        session["deal_terms"] = json.loads(session["deal_terms_json"])
        return session


def update_negotiation_session(session_id: int, **fields: Any) -> None:
    if not fields:
        return
    fields["updated_at"] = time.time()
    cols = ", ".join(f"{k} = ?" for k in fields)
    vals = list(fields.values()) + [session_id]
    with get_conn() as conn:
        conn.execute(
            f"UPDATE negotiation_sessions SET {cols} WHERE id = ?",
            vals,
        )


def add_negotiation_round(
    session_id: int, round_num: int, persona: str, message: str
) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO negotiation_rounds (session_id, round_num, persona, message, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (session_id, round_num, persona, message, time.time()),
        )
