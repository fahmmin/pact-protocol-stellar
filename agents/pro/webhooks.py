"""Pro webhook dispatch stubs."""

from __future__ import annotations

import json
import logging
import os
import urllib.request
from typing import Any

logger = logging.getLogger("pact-agents.pro.webhooks")


def dispatch_webhook(event: str, payload: dict[str, Any]) -> bool:
    url = os.environ.get("PRO_WEBHOOK_URL", "")
    if not url:
        logger.debug("PRO_WEBHOOK_URL not set; skipping webhook for %s", event)
        return False
    body = json.dumps({"event": event, "payload": payload}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return 200 <= resp.status < 300
    except Exception as exc:
        logger.warning("Webhook dispatch failed: %s", exc)
        return False
