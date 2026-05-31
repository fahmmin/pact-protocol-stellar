from __future__ import annotations

import logging
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load repo-root .env before other modules read os.environ
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from auth import require_api_key
from db import (
    add_compliance_action,
    create_settlement_review,
    get_compliance_actions,
    get_daily_checks,
    get_negotiation_session,
    get_profile_audit,
    get_settlement_readiness,
    get_active_prompt,
    init_db,
    list_prompts,
    list_settlement_reviews,
    list_verification_requests,
    log_profile_change,
    review_verification,
    submit_verification,
    upsert_prompt,
)
from indexer_sync import run_full_sync
from matchmaker import accept_match, list_proposals, propose_matches, reject_match, search_agents
from orchestration import (
    advance_negotiation_session,
    approve_negotiation_session,
    run_negotiation,
    start_negotiation_session,
)
from scheduler import get_scheduler_config, run_daily_checks
from stellar_ops import settlement_on_chain_actions, verification_on_chain_action

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pact-agents")


class RuntimeMetrics:
    def __init__(self) -> None:
        self.started_at = time.time()
        self.total_requests = 0
        self.total_negotiations = 0
        self.status_codes: dict[int, int] = defaultdict(int)
        self.total_latency_ms = 0.0

    def record_request(self, status_code: int, latency_ms: float) -> None:
        self.total_requests += 1
        self.status_codes[status_code] += 1
        self.total_latency_ms += latency_ms

    def record_negotiation(self) -> None:
        self.total_negotiations += 1

    def snapshot(self) -> dict:
        avg = self.total_latency_ms / self.total_requests if self.total_requests else 0.0
        return {
            "uptime_seconds": int(time.time() - self.started_at),
            "total_requests": self.total_requests,
            "total_negotiations": self.total_negotiations,
            "avg_latency_ms": round(avg, 2),
            "status_codes": dict(sorted(self.status_codes.items(), key=lambda x: x[0])),
        }


METRICS = RuntimeMetrics()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    logger.info("Agent runtime DB initialized at startup")
    try:
        sync_result = run_full_sync()
        logger.info("Indexer sync on startup: %s", sync_result)
    except Exception as exc:
        logger.warning("Indexer sync skipped on startup: %s", exc)
    yield


app = FastAPI(title="Pact Protocol Stellar Agents", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ──────────────────────────────────────────────


class NegotiationRequest(BaseModel):
    creator_id: str
    brand_id: str
    initial_offer: int
    persona: str | None = None


class VerificationSubmit(BaseModel):
    agent_id: int
    wallet: str
    platform: str
    handle: str
    proof_url: str
    notes: str | None = None


class VerificationReview(BaseModel):
    approved: bool
    reviewer_notes: str = ""


class ComplianceAction(BaseModel):
    deal_id: int
    level: str = Field(pattern="^(warning|remediation|escalation)$")
    actor: str
    message: str


class DailyCheckItem(BaseModel):
    deal_id: int
    engagement_bps: int = 0
    likes: int = 0
    views: int = 0
    kpi_threshold_bps: int | None = None
    notes: str | None = None


class DailyCheckBatch(BaseModel):
    deals: list[DailyCheckItem]


class PromptUpsert(BaseModel):
    template_id: str
    persona_id: str
    system_prompt: str
    constraints: dict[str, Any] = Field(default_factory=dict)
    activate: bool = True


class ProfileAuditLog(BaseModel):
    agent_id: int
    field: str
    old_value: str
    new_value: str


class MatchProposeRequest(BaseModel):
    brand_agent_id: int
    platform: str | None = None
    min_followers: int | None = None
    limit: int = 5


class NegotiationSessionStart(BaseModel):
    creator_id: str
    brand_id: str
    payment_stroops: int
    creator_stake_stroops: int
    brand_stake_stroops: int
    deadline_ts: int
    kpi_threshold_bps: int = 500
    match_proposal_id: int | None = None
    max_rounds: int = 4


class NegotiationApprove(BaseModel):
    party: str = Field(pattern="^(creator|brand)$")
    approved: bool = True


class SettlementReviewRequest(BaseModel):
    deal_id: int
    engagement_bps: int
    likes: int = 0
    views: int = 0
    success: bool
    reviewer_notes: str = ""


# ── Middleware ──────────────────────────────────────────────────


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    METRICS.record_request(response.status_code, elapsed_ms)
    return response


# ── Health & metrics ────────────────────────────────────────────


@app.get("/")
def read_root():
    return {"message": "Stellar Agent Runtime", "version": "0.2.0"}


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "pact-stellar-agents"}


@app.get("/metrics/summary")
def metrics_summary():
    return METRICS.snapshot()


@app.get("/metrics")
def metrics_prometheus():
    snapshot = METRICS.snapshot()
    lines = [
        "# HELP pact_agent_uptime_seconds Process uptime in seconds",
        "# TYPE pact_agent_uptime_seconds gauge",
        f"pact_agent_uptime_seconds {snapshot['uptime_seconds']}",
        "# HELP pact_agent_requests_total Total HTTP requests",
        "# TYPE pact_agent_requests_total counter",
        f"pact_agent_requests_total {snapshot['total_requests']}",
        "# HELP pact_agent_negotiations_total Total negotiation attempts",
        "# TYPE pact_agent_negotiations_total counter",
        f"pact_agent_negotiations_total {snapshot['total_negotiations']}",
        "# HELP pact_agent_request_latency_ms Average request latency in ms",
        "# TYPE pact_agent_request_latency_ms gauge",
        f"pact_agent_request_latency_ms {snapshot['avg_latency_ms']}",
    ]
    for status_code, count in snapshot["status_codes"].items():
        lines.append(
            f'pact_agent_http_status_total{{code="{status_code}"}} {count}'
        )
    return "\n".join(lines) + "\n"


# ── Negotiation (orchestrated) ──────────────────────────────────


@app.post("/negotiate")
def negotiate(req: NegotiationRequest):
    METRICS.record_negotiation()
    result = run_negotiation(
        req.creator_id,
        req.brand_id,
        req.initial_offer,
        req.persona,
    )
    return result


# ── Multi-turn negotiation sessions ─────────────────────────────


@app.post("/negotiate/session")
def negotiate_session_start(req: NegotiationSessionStart):
    METRICS.record_negotiation()
    return start_negotiation_session(
        req.creator_id,
        req.brand_id,
        req.payment_stroops,
        req.creator_stake_stroops,
        req.brand_stake_stroops,
        req.deadline_ts,
        req.kpi_threshold_bps,
        req.match_proposal_id,
        req.max_rounds,
    )


@app.get("/negotiate/session/{session_id}")
def negotiate_session_get(session_id: int):
    session = get_negotiation_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": session}


@app.post("/negotiate/session/{session_id}/round")
def negotiate_session_round(session_id: int):
    return advance_negotiation_session(session_id)


@app.post("/negotiate/session/{session_id}/approve")
def negotiate_session_approve(session_id: int, req: NegotiationApprove):
    return approve_negotiation_session(session_id, req.party, req.approved)


# ── Matchmaker ──────────────────────────────────────────────────


@app.get("/agents/search")
def agents_search(
    agent_type: str | None = None,
    platform: str | None = None,
    verified_only: bool = False,
    min_followers: int | None = None,
    limit: int = 20,
):
    return {
        "agents": search_agents(
            agent_type=agent_type,
            platform=platform,
            verified_only=verified_only,
            min_followers=min_followers,
            limit=limit,
        )
    }


@app.post("/match/propose")
def match_propose(req: MatchProposeRequest):
    proposals = propose_matches(
        brand_agent_id=req.brand_agent_id,
        platform=req.platform,
        min_followers=req.min_followers,
        limit=req.limit,
    )
    return {"proposals": proposals}


@app.get("/match/proposals")
def match_proposals_list(
    brand_agent_id: int | None = None,
    creator_agent_id: int | None = None,
    status: str | None = "pending",
):
    return {
        "proposals": list_proposals(
            brand_agent_id=brand_agent_id,
            creator_agent_id=creator_agent_id,
            status=status,
        )
    }


@app.post("/match/{proposal_id}/accept")
def match_accept(proposal_id: int):
    result = accept_match(proposal_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("detail"))
    return result


@app.post("/match/{proposal_id}/reject")
def match_reject(proposal_id: int):
    result = reject_match(proposal_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("detail"))
    return result


# ── Indexer sync ────────────────────────────────────────────────


@app.post("/indexer/sync")
def indexer_sync(_: None = Depends(require_api_key)):
    return run_full_sync()


# ── Verification (manual review) ────────────────────────────────


@app.post("/verification/submit")
def verification_submit(
    req: VerificationSubmit,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    row = submit_verification(
        agent_id=req.agent_id,
        wallet=req.wallet,
        platform=req.platform,
        handle=req.handle,
        proof_url=req.proof_url,
        notes=req.notes,
        idempotency_key=idempotency_key,
    )
    return {"status": "submitted", "request": row}


@app.get("/verification/requests")
def verification_list(
    status: str | None = None,
    _: None = Depends(require_api_key),
):
    return {"requests": list_verification_requests(status)}


@app.get("/verification/status/{agent_id}")
def verification_status(agent_id: int):
    rows = [
        r
        for r in list_verification_requests()
        if r["agent_id"] == agent_id
    ]
    latest = rows[0] if rows else None
    return {"agent_id": agent_id, "latest_request": latest}


@app.post("/verification/review/{request_id}")
def verification_review(
    request_id: int,
    req: VerificationReview,
    _: None = Depends(require_api_key),
):
    row = review_verification(request_id, req.approved, req.reviewer_notes)
    on_chain = verification_on_chain_action(int(row["agent_id"]), req.approved)
    return {
        "status": row["status"],
        "request": row,
        "on_chain_action": on_chain,
    }


# ── Daily metric checks ─────────────────────────────────────────


@app.post("/scheduler/daily-checks")
def trigger_daily_checks(
    batch: DailyCheckBatch,
    _: None = Depends(require_api_key),
):
    deals = [d.model_dump() for d in batch.deals]
    results = run_daily_checks(deals)
    return {"checked": len(results), "results": results}


@app.get("/deals/{deal_id}/metrics")
def deal_metrics(deal_id: int):
    readiness = get_settlement_readiness(deal_id)
    return {
        "deal_id": deal_id,
        "daily_checks": get_daily_checks(deal_id),
        "compliance_actions": get_compliance_actions(deal_id),
        "settlement_readiness": readiness,
    }


@app.post("/oracle/settlement/review")
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


@app.get("/oracle/settlement/reviews")
def oracle_settlement_reviews(
    status: str | None = None,
    _: None = Depends(require_api_key),
):
    return {"reviews": list_settlement_reviews(status)}


@app.get("/scheduler/config")
def scheduler_config():
    return get_scheduler_config()


# ── Compliance ──────────────────────────────────────────────────


@app.post("/compliance/actions")
def post_compliance(req: ComplianceAction, _: None = Depends(require_api_key)):
    row = add_compliance_action(req.deal_id, req.level, req.actor, req.message)
    return {"action": row}


@app.get("/compliance/actions/{deal_id}")
def list_compliance(deal_id: int):
    return {"actions": get_compliance_actions(deal_id)}


# ── Prompt / persona admin ──────────────────────────────────────


@app.get("/admin/prompts")
def admin_list_prompts(_: None = Depends(require_api_key)):
    return {"prompts": list_prompts()}


@app.get("/admin/prompts/{persona_id}")
def admin_get_active_prompt(persona_id: str):
    template = get_active_prompt(persona_id)
    if not template:
        raise HTTPException(status_code=404, detail="No active prompt for persona")
    return template


@app.put("/admin/prompts")
def admin_upsert_prompt(req: PromptUpsert, _: None = Depends(require_api_key)):
    row = upsert_prompt(
        req.template_id,
        req.persona_id,
        req.system_prompt,
        req.constraints,
        req.activate,
    )
    return {"prompt": row}


# ── Profile audit ───────────────────────────────────────────────


@app.post("/profile/audit")
def profile_audit_log(req: ProfileAuditLog):
    log_profile_change(req.agent_id, req.field, req.old_value, req.new_value)
    return {"status": "logged"}


@app.get("/profile/audit/{agent_id}")
def profile_audit_get(agent_id: int):
    return {"audit": get_profile_audit(agent_id)}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("AGENT_RUNTIME_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
