"""Runtime metrics collector."""

from __future__ import annotations

import time
from collections import defaultdict


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
