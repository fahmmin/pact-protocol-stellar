"""Backward-compatible entry point for the agent runtime."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from pact.api.main import app  # noqa: E402

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("AGENT_RUNTIME_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
