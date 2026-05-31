#!/usr/bin/env python3
"""Simple testnet indexer for Pact Protocol contract events."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import time
import subprocess
from datetime import datetime, timezone
from pathlib import Path


RPC_URL = "https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
DEFAULT_DB = Path(__file__).resolve().parents[1] / "ops" / "indexer" / "pact_indexer.db"

CONTRACTS = {
    "agent_registry": "CBIORX6H6LNFVJZDDR5VRIK2SMS33F65NLAZXXUVIJCWDGQYFQBI3AMB",
    "validation_registry": "CCLSZGX22VETSIMFE27NXO4KOPLJOHRTRLGQTDJVBSX3IWRQCPIXSKWA",
    "campaign_oracle": "CANGGB2JIORNUTNWWMWCORYKHMYBO64BEC464RLX2WIDFTD772PAUE2E",
    "deal_vault": "CBYJ4ZCAUBOKLLGYE4JLHBUOGCHLB4IA56G6JQH2DF5E5UCZWEULUIDZ",
    "pact_market": "CCTXVX6LYNHPL2XJHNOTXKJ33IOY7BYLPMN7SHMV6X2YW7LBPYNG2I4E",
}


def fetch_events(contract_id: str, limit: int) -> list[dict]:
    start_ledger = "1"
    for _ in range(8):
        cmd = [
            "stellar",
            "events",
            "--id",
            contract_id,
            "--count",
            str(limit),
            "--output",
            "json",
            "--rpc-url",
            RPC_URL,
            "--network-passphrase",
            NETWORK_PASSPHRASE,
            "--start-ledger",
            start_ledger,
        ]
        proc = subprocess.run(cmd, text=True, capture_output=True)
        if proc.returncode == 0:
            body = proc.stdout.strip()
            if not body or body == "No events":
                return []
            payload = json.loads(body)
            return payload if isinstance(payload, list) else []

        err = (proc.stderr or proc.stdout).strip()
        range_match = re.search(r"ledger range:\s*(\d+)\s*-\s*(\d+)", err)
        if range_match:
            start_ledger = range_match.group(1)
            continue
        raise RuntimeError(err)

    raise RuntimeError(f"Could not fetch events for {contract_id}")


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS contract_events (
            contract_key TEXT NOT NULL,
            contract_id TEXT NOT NULL,
            event_id TEXT PRIMARY KEY,
            ledger INTEGER,
            ledger_closed_at TEXT,
            event_type TEXT,
            paging_token TEXT,
            raw_json TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS indexer_runs (
            run_id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            rows_inserted INTEGER NOT NULL DEFAULT 0,
            cursor_map_json TEXT NOT NULL
        )
        """
    )
    conn.commit()


def load_existing_hashes(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT event_id FROM contract_events").fetchall()
    return {row[0] for row in rows}


def index_contract(conn: sqlite3.Connection, contract_key: str, contract_id: str, limit: int) -> tuple[int, str | None]:
    records = fetch_events(contract_id, limit)
    existing = load_existing_hashes(conn)
    inserted = 0
    newest_paging_token = None
    for record in records:
        event_id = str(record.get("id", ""))
        if not event_id or event_id in existing:
            continue
        conn.execute(
            """
            INSERT INTO contract_events(
                contract_key, contract_id, event_id, ledger, ledger_closed_at,
                event_type, paging_token, raw_json
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                contract_key,
                contract_id,
                event_id,
                int(record.get("ledger", 0)),
                record.get("ledgerClosedAt"),
                record.get("type"),
                record.get("paging_token"),
                json.dumps(record, separators=(",", ":")),
            ),
        )
        inserted += 1
        newest_paging_token = newest_paging_token or str(record.get("paging_token"))
    conn.commit()
    return inserted, newest_paging_token


def main() -> None:
    parser = argparse.ArgumentParser(description="Index Pact contract event history from Soroban RPC.")
    parser.add_argument("--db-path", default=str(DEFAULT_DB), help="SQLite database path")
    parser.add_argument("--per-contract-limit", type=int, default=30, help="How many recent events to fetch per contract")
    args = parser.parse_args()

    db_path = Path(args.db_path).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    init_db(conn)

    started = datetime.now(tz=timezone.utc).isoformat()
    total_inserted = 0
    cursor_map: dict[str, str | None] = {}
    for key, contract_id in CONTRACTS.items():
        inserted, newest = index_contract(conn, key, contract_id, args.per_contract_limit)
        total_inserted += inserted
        cursor_map[key] = newest
        time.sleep(0.2)

    finished = datetime.now(tz=timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO indexer_runs(started_at, finished_at, rows_inserted, cursor_map_json)
        VALUES(?, ?, ?, ?)
        """,
        (started, finished, total_inserted, json.dumps(cursor_map)),
    )
    conn.commit()
    conn.close()
    print(json.dumps({"db_path": str(db_path), "rows_inserted": total_inserted, "cursor_map": cursor_map}, indent=2))


if __name__ == "__main__":
    main()
