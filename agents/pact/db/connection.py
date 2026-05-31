"""SQLite connection and schema initialization."""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[3] / "ops" / "agents" / "pact_agents.db"


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
