"""Sync on-chain AgentRegistry / DealVault state into agent runtime SQLite."""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
from pathlib import Path
from typing import Any

from pact.config import get_settings
from pact.db import upsert_indexed_agent, upsert_indexed_deal

logger = logging.getLogger("pact-agents.indexer_sync")


def _contract_config() -> tuple[str, str, str, str, int]:
    settings = get_settings()
    return (
        settings.rpc_url,
        settings.network_passphrase,
        settings.contracts.agent_registry,
        settings.contracts.deal_vault,
        settings.indexer_max_deals,
    )


def _invoke(contract_id: str, fn: str, args: list[str]) -> Any:
    rpc_url, network_passphrase, _, _, _ = _contract_config()
    cmd = [
        "stellar",
        "contract",
        "invoke",
        "--id",
        contract_id,
        "--send=no",
        "--output",
        "json",
        "--rpc-url",
        rpc_url,
        "--network-passphrase",
        network_passphrase,
        "--",
        fn,
        *args,
    ]
    proc = subprocess.run(cmd, text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout).strip())
    out = proc.stdout.strip()
    if not out:
        return None
    return json.loads(out)


def _parse_profile(raw: Any, agent_id: int) -> dict[str, Any] | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        data = raw
    else:
        return None

    agent_type = "Creator"
    if "Brand" in str(data.get("agent_type", "")):
        agent_type = "Brand"

    return {
        "agent_id": agent_id,
        "wallet": str(data.get("wallet", "")),
        "agent_type": agent_type,
        "handle": str(data.get("handle", "")),
        "platform": str(data.get("platform", "")),
        "follower_count": int(data.get("follower_count") or 0),
        "verified": 1 if data.get("verified") else 0,
        "tier": 0,
        "avg_engagement_bps": 0,
        "total_deals": 0,
    }


def _parse_score(raw: Any) -> dict[str, int]:
    if not isinstance(raw, dict):
        return {"tier": 0, "avg_engagement_bps": 0, "total_deals": 0}
    tier_map = {"Bronze": 0, "Silver": 1, "Gold": 2, "Diamond": 3}
    tier_raw = str(raw.get("tier", "Bronze"))
    tier = tier_map.get(tier_raw, 0)
    if isinstance(raw.get("tier"), int):
        tier = int(raw["tier"])
    return {
        "tier": tier,
        "avg_engagement_bps": int(raw.get("avg_engagement_bps") or 0),
        "total_deals": int(raw.get("total_deals") or 0),
    }


def sync_agent_profiles() -> int:
    _, _, agent_registry, _, _ = _contract_config()
    count_raw = _invoke(agent_registry, "agent_count", [])
    agent_count = int(count_raw) if count_raw is not None else 0
    synced = 0

    for agent_id in range(1, agent_count + 1):
        try:
            profile_raw = _invoke(
                agent_registry, "get_profile", ["--agent-id", str(agent_id)]
            )
            profile = _parse_profile(profile_raw, agent_id)
            if not profile:
                continue
            try:
                score_raw = _invoke(
                    agent_registry, "get_score", ["--agent-id", str(agent_id)]
                )
                profile.update(_parse_score(score_raw))
            except Exception:
                pass
            upsert_indexed_agent(profile)
            synced += 1
        except Exception as exc:
            logger.debug("skip agent %s: %s", agent_id, exc)

    return synced


def sync_deals() -> int:
    _, _, _, deal_vault, max_deal_scan = _contract_config()
    synced = 0
    for deal_id in range(1, max_deal_scan + 1):
        try:
            raw = _invoke(deal_vault, "get_deal", ["--deal-id", str(deal_id)])
            if not isinstance(raw, dict):
                continue
            status_map = {
                "Pending": 0,
                "Active": 1,
                "Delivered": 2,
                "Settled": 3,
                "Cancelled": 4,
                "Slashed": 5,
            }
            status_str = str(raw.get("status", "Pending"))
            status = status_map.get(status_str, 0)
            upsert_indexed_deal(
                {
                    "deal_id": deal_id,
                    "creator_agent_id": int(raw.get("creator_agent_id") or 0),
                    "brand_agent_id": int(raw.get("brand_agent_id") or 0),
                    "status": status,
                    "creator_wallet": str(raw.get("creator_wallet", "")),
                    "brand_wallet": str(raw.get("brand_wallet", "")),
                    "deadline": int(raw.get("deadline") or 0),
                }
            )
            synced += 1
        except Exception:
            break
    return synced


def sync_indexer_events(db_path: str | None = None) -> int:
    """Import raw contract events from indexer DB if present."""
    path = Path(db_path or os.environ.get("INDEXER_DB_PATH", ""))
    if not path.exists():
        default = (
            Path(__file__).resolve().parents[3] / "ops" / "indexer" / "pact_indexer.db"
        )
        path = default
    if not path.exists():
        return 0

    import sqlite3

    conn = sqlite3.connect(str(path))
    rows = conn.execute(
        "SELECT contract_key, raw_json FROM contract_events WHERE contract_key = 'agent_registry'"
    ).fetchall()
    conn.close()

    imported = 0
    for _, raw_json in rows:
        try:
            record = json.loads(raw_json)
            body = str(record)
            id_match = re.search(r"agent_id[\":\s]+(\d+)", body)
            if id_match:
                imported += 1
        except Exception:
            continue
    return imported


def run_full_sync() -> dict[str, Any]:
    agents = sync_agent_profiles()
    deals = sync_deals()
    events = sync_indexer_events()
    return {
        "agents_synced": agents,
        "deals_synced": deals,
        "indexer_events_scanned": events,
    }
