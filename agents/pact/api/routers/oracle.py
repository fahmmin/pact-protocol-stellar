"""Oracle, scheduler, and deal metrics routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from pact.api.deps import require_api_key
from pact.api.schemas import DailyCheckBatch, SettlementReviewRequest
from pact.db import (
    create_settlement_review,
    get_compliance_actions,
    get_daily_checks,
    get_settlement_readiness,
    list_settlement_reviews,
)
from pact.services.scheduler import get_scheduler_config, run_daily_checks
from pact.services.stellar_ops import settlement_on_chain_actions

router = APIRouter(tags=["oracle"])


@router.post("/scheduler/daily-checks")
def trigger_daily_checks(
    batch: DailyCheckBatch,
    _: None = Depends(require_api_key),
):
    deals = [d.model_dump() for d in batch.deals]
    results = run_daily_checks(deals)
    return {"checked": len(results), "results": results}


@router.get("/deals/{deal_id}/metrics")
def deal_metrics(deal_id: int):
    readiness = get_settlement_readiness(deal_id)
    return {
        "deal_id": deal_id,
        "daily_checks": get_daily_checks(deal_id),
        "compliance_actions": get_compliance_actions(deal_id),
        "settlement_readiness": readiness,
    }


@router.post("/oracle/settlement/review")
def oracle_settlement_review(
    req: SettlementReviewRequest,
    _: None = Depends(require_api_key),
):
    review = create_settlement_review(
        deal_id=req.deal_id,
        engagement_bps=req.engagement_bps,
        likes=req.likes,
        views=req.views,
        success=req.success,
        reviewer_notes=req.reviewer_notes,
    )
    actions = settlement_on_chain_actions(
        req.deal_id,
        req.engagement_bps,
        req.views,
        req.success,
    )
    return {"review": review, "on_chain_actions": actions}


@router.get("/oracle/settlement/reviews")
def oracle_settlement_reviews(
    status: str | None = None,
    _: None = Depends(require_api_key),
):
    return {"reviews": list_settlement_reviews(status)}


@router.get("/scheduler/config")
def scheduler_config():
    return get_scheduler_config()
