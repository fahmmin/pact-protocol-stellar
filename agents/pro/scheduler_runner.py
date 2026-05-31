"""Pro automated scheduler runner (APScheduler optional)."""

from __future__ import annotations

import logging
from typing import Any

from pact.db import list_indexed_deals
from pact.services.scheduler import run_daily_checks

logger = logging.getLogger("pact-agents.pro.scheduler")


def discover_active_deals() -> list[dict[str, Any]]:
    """Build daily-check batch from indexed deals in Active status (1)."""
    deals = list_indexed_deals(limit=100)
    return [
        {"deal_id": d["deal_id"], "engagement_bps": 0, "likes": 0, "views": 0}
        for d in deals
        if int(d.get("status", 0)) == 1
    ]


def run_scheduled_daily_checks() -> dict[str, Any]:
    batch = discover_active_deals()
    if not batch:
        return {"checked": 0, "results": [], "note": "No active deals in indexer"}
    results = run_daily_checks(batch)
    return {"checked": len(results), "results": results}


def start_scheduler() -> None:
    """Start APScheduler if installed; otherwise log manual-only mode."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler

        from pact.config import get_settings

        settings = get_settings()
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            run_scheduled_daily_checks,
            "cron",
            hour=settings.daily_check_hour_utc,
            id="daily_kpi_checks",
        )
        scheduler.start()
        logger.info("Pro scheduler started (hour UTC=%s)", settings.daily_check_hour_utc)
    except ImportError:
        logger.info("APScheduler not installed; use POST /pro/scheduler/run manually")
