"""Prompt template repositories."""

from __future__ import annotations

import json
import time
from typing import Any

from pact.db.connection import get_conn


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
