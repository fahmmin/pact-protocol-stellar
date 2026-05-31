#!/usr/bin/env python3
"""Trigger daily KPI checks via agent runtime API.

Usage:
  ORACLE_API_KEY=secret python scripts/agents/run_daily_checks.py

Pass deal metrics as JSON file:
  python scripts/agents/run_daily_checks.py --deals ops/monitoring/sample-deals.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request

BASE = os.environ.get("AGENT_RUNTIME_URL", "http://localhost:8000")
API_KEY = os.environ.get("ORACLE_API_KEY", "")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--deals",
        default="ops/monitoring/sample-deals.json",
        help="JSON file with list of deal metric objects",
    )
    args = parser.parse_args()

    deals_path = args.deals
    if os.path.isfile(deals_path):
        with open(deals_path) as f:
            deals = json.load(f)
    else:
        deals = [
            {"deal_id": 1, "engagement_bps": 620, "likes": 1200, "views": 45000},
        ]

    body = json.dumps({"deals": deals}).encode()
    req = urllib.request.Request(
        f"{BASE}/scheduler/daily-checks",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
            print(json.dumps(result, indent=2))
            return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
