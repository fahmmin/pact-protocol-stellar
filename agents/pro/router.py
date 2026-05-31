"""Pro tier FastAPI routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, FastAPI

from pro.analytics import get_deal_analytics, get_platform_summary
from pro.api_keys import require_pro_api_key
from pro.scheduler_runner import run_scheduled_daily_checks, start_scheduler


def register_pro_routes(app: FastAPI) -> None:
    router = APIRouter(prefix="/pro", tags=["pro"])

    @router.get("/analytics/deals")
    def pro_deal_analytics(
        limit: int = 50,
        _: None = Depends(require_pro_api_key),
    ):
        return get_deal_analytics(limit)

    @router.get("/analytics/summary")
    def pro_platform_summary(_: None = Depends(require_pro_api_key)):
        return get_platform_summary()

    @router.post("/scheduler/run")
    def pro_run_scheduler(_: None = Depends(require_pro_api_key)):
        return run_scheduled_daily_checks()

    app.include_router(router)
    start_scheduler()
