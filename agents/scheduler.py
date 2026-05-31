"""Daily metric check scheduler for active deals."""

from __future__ import annotations

import os
from typing import Any

from db import add_compliance_action, record_daily_check


# Deals to check: in production, indexer provides this list
def run_daily_checks(
    deals: list[dict[str, Any]],
    default_threshold_bps: int = 500,
) -> list[dict[str, Any]]:
    """Process daily KPI checks for deals.

    Each deal dict: deal_id, engagement_bps, likes, views, deadline_ts (optional)
    """
    results = []
    for deal in deals:
        deal_id = int(deal["deal_id"])
        engagement_bps = int(deal.get("engagement_bps", 0))
        likes = int(deal.get("likes", 0))
        views = int(deal.get("views", 0))
        threshold = int(deal.get("kpi_threshold_bps", default_threshold_bps))
        kpi_met = engagement_bps >= threshold

        check = record_daily_check(
            deal_id=deal_id,
            engagement_bps=engagement_bps,
            likes=likes,
            views=views,
            kpi_met=kpi_met,
            notes=deal.get("notes"),
        )
        results.append(check)

        if not kpi_met:
            add_compliance_action(
                deal_id=deal_id,
                level="warning",
                actor="scheduler",
                message=f"KPI below threshold: {engagement_bps} bps < {threshold} bps",
            )

    return results


def get_scheduler_config() -> dict[str, Any]:
    return {
        "daily_check_hour_utc": int(os.environ.get("DAILY_CHECK_HOUR_UTC", "0")),
        "default_threshold_bps": int(os.environ.get("DEFAULT_KPI_THRESHOLD_BPS", "500")),
    }
