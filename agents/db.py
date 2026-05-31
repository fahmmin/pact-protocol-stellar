"""SQLite persistence for verification, compliance, prompts, and audits."""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent.parent / "ops" / "agents" / "pact_agents.db"


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS verification_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                wallet TEXT NOT NULL,
                platform TEXT NOT NULL,
                handle TEXT NOT NULL,
                proof_url TEXT NOT NULL,
                notes TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                reviewer_notes TEXT,
                created_at REAL NOT NULL,
                reviewed_at REAL,
                idempotency_key TEXT UNIQUE
            );

            CREATE TABLE IF NOT EXISTS daily_metric_checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deal_id INTEGER NOT NULL,
                engagement_bps INTEGER NOT NULL,
                likes INTEGER DEFAULT 0,
                views INTEGER DEFAULT 0,
                kpi_met INTEGER NOT NULL DEFAULT 0,
                notes TEXT,
                checked_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS compliance_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deal_id INTEGER NOT NULL,
                level TEXT NOT NULL,
                actor TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS prompt_templates (
                id TEXT NOT NULL,
                version INTEGER NOT NULL,
                persona_id TEXT NOT NULL,
                system_prompt TEXT NOT NULL,
                constraints_json TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (id, version)
            );

            CREATE TABLE IF NOT EXISTS prompt_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                persona_id TEXT,
                template_id TEXT,
                details TEXT,
                created_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profile_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                field TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                created_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS negotiation_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                creator_id TEXT NOT NULL,
                brand_id TEXT NOT NULL,
                persona_used TEXT NOT NULL,
                template_version INTEGER,
                deal_intent_hash TEXT NOT NULL,
                terms_summary TEXT,
                created_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS indexed_agents (
                agent_id INTEGER PRIMARY KEY,
                wallet TEXT NOT NULL DEFAULT '',
                agent_type TEXT NOT NULL DEFAULT 'Creator',
                handle TEXT NOT NULL DEFAULT '',
                platform TEXT NOT NULL DEFAULT '',
                follower_count INTEGER NOT NULL DEFAULT 0,
                verified INTEGER NOT NULL DEFAULT 0,
                tier INTEGER NOT NULL DEFAULT 0,
                avg_engagement_bps INTEGER NOT NULL DEFAULT 0,
                total_deals INTEGER NOT NULL DEFAULT 0,
                synced_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS indexed_deals (
                deal_id INTEGER PRIMARY KEY,
                creator_agent_id INTEGER NOT NULL,
                brand_agent_id INTEGER NOT NULL,
                status INTEGER NOT NULL DEFAULT 0,
                creator_wallet TEXT NOT NULL DEFAULT '',
                brand_wallet TEXT NOT NULL DEFAULT '',
                deadline INTEGER NOT NULL DEFAULT 0,
                synced_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS match_proposals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_agent_id INTEGER NOT NULL,
                creator_agent_id INTEGER NOT NULL,
                score REAL NOT NULL DEFAULT 0,
                rationale TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'pending',
                created_at REAL NOT NULL,
                responded_at REAL
            );

            CREATE TABLE IF NOT EXISTS negotiation_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                creator_id TEXT NOT NULL,
                brand_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'negotiating',
                deal_terms_json TEXT NOT NULL,
                deal_intent_hash TEXT NOT NULL,
                terms_summary TEXT,
                rounds INTEGER NOT NULL DEFAULT 0,
                max_rounds INTEGER NOT NULL DEFAULT 4,
                creator_approved INTEGER NOT NULL DEFAULT 0,
                brand_approved INTEGER NOT NULL DEFAULT 0,
                match_proposal_id INTEGER,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS negotiation_rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                round_num INTEGER NOT NULL,
                persona TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at REAL NOT NULL,
                FOREIGN KEY (session_id) REFERENCES negotiation_sessions(id)
            );

            CREATE TABLE IF NOT EXISTS settlement_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deal_id INTEGER NOT NULL,
                engagement_bps INTEGER NOT NULL,
                likes INTEGER NOT NULL DEFAULT 0,
                views INTEGER NOT NULL DEFAULT 0,
                success INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending',
                reviewer_notes TEXT,
                created_at REAL NOT NULL,
                reviewed_at REAL
            );
            """
        )
        _seed_default_prompts(conn)


def _seed_default_prompts(conn: sqlite3.Connection) -> None:
    defaults = [
        (
            "creator_default",
            1,
            "creator_default",
            "You negotiate creator-brand deals fairly. Maximize creator payment while honoring brand guidelines.",
            json.dumps({"max_payment_unverified_usdc": 5_000_000, "require_dual_sign": True}),
        ),
        (
            "brand_default",
            1,
            "brand_default",
            "You negotiate on behalf of brands. Maximize ROI and enforce content guidelines.",
            json.dumps({"max_payment_unverified_usdc": 5_000_000, "require_dual_sign": True}),
        ),
        (
            "ops_neutral",
            1,
            "ops_neutral",
            "Summarize deal terms neutrally for oracle review.",
            json.dumps({}),
        ),
    ]
    for row in defaults:
        conn.execute(
            """
            INSERT OR IGNORE INTO prompt_templates
            (id, version, persona_id, system_prompt, constraints_json, active)
            VALUES (?, ?, ?, ?, ?, 1)
            """,
            row,
        )


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


def get_active_prompt(persona_id: str) -> dict[str, Any] | None:
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT * FROM prompt_templates
            WHERE persona_id = ? AND active = 1
            ORDER BY version DESC LIMIT 1
            """,
            (persona_id,),
        ).fetchone()
        return dict(row) if row else None


def list_prompts() -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM prompt_templates ORDER BY persona_id, version DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def upsert_prompt(
    template_id: str,
    persona_id: str,
    system_prompt: str,
    constraints: dict[str, Any],
    activate: bool = False,
) -> dict[str, Any]:
    with get_conn() as conn:
        max_ver = conn.execute(
            "SELECT COALESCE(MAX(version), 0) FROM prompt_templates WHERE id = ?",
            (template_id,),
        ).fetchone()[0]
        version = max_ver + 1
        if activate:
            conn.execute(
                "UPDATE prompt_templates SET active = 0 WHERE persona_id = ?",
                (persona_id,),
            )
        conn.execute(
            """
            INSERT INTO prompt_templates
            (id, version, persona_id, system_prompt, constraints_json, active)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                template_id,
                version,
                persona_id,
                system_prompt,
                json.dumps(constraints),
                1 if activate else 0,
            ),
        )
        conn.execute(
            """
            INSERT INTO prompt_audit (action, persona_id, template_id, details, created_at)
            VALUES ('upsert', ?, ?, ?, ?)
            """,
            (persona_id, template_id, json.dumps({"version": version}), time.time()),
        )
        row = conn.execute(
            "SELECT * FROM prompt_templates WHERE id = ? AND version = ?",
            (template_id, version),
        ).fetchone()
        return dict(row)


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


# ── Indexed chain state ─────────────────────────────────────────


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


# ── Match proposals ─────────────────────────────────────────────


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


# ── Negotiation sessions ────────────────────────────────────────


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


# ── Settlement reviews ──────────────────────────────────────────


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
