"""Health and metrics routes."""

from __future__ import annotations

from fastapi import APIRouter, Request

from pact.api.metrics import METRICS

router = APIRouter(tags=["health"])


@router.get("/")
def read_root():
    return {"message": "Stellar Agent Runtime", "version": "0.2.0"}


@router.get("/healthz")
def healthz():
    return {"status": "ok", "service": "pact-stellar-agents"}


@router.get("/metrics/summary")
def metrics_summary():
    return METRICS.snapshot()


@router.get("/metrics")
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


def metrics_middleware(request: Request, call_next):
    import time

    started = time.perf_counter()
    response = call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    METRICS.record_request(response.status_code, elapsed_ms)
    return response
