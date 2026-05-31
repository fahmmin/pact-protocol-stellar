"""FastAPI application factory."""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

from pact.api.metrics import METRICS
from pact.api.routers import admin, compliance, health, indexer, match, negotiation, oracle, profile, verification
from pact.config import get_settings
from pact.db import init_db, list_indexed_deals
from pact.integrations.stellar.indexer_sync import run_full_sync

logger = logging.getLogger("pact-agents")


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


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Pact Protocol Stellar Agents", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        started = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started) * 1000
        METRICS.record_request(response.status_code, elapsed_ms)
        return response

    app.include_router(health.router)
    app.include_router(negotiation.router)
    app.include_router(match.router)
    app.include_router(indexer.router)
    app.include_router(verification.router)
    app.include_router(oracle.router)
    app.include_router(compliance.router)
    app.include_router(admin.router)
    app.include_router(profile.router)

    @app.get("/indexer/deals")
    def list_deals(limit: int = 50):
        return {"deals": list_indexed_deals(limit)}

    if settings.is_pro:
        from pro.router import register_pro_routes

        register_pro_routes(app)
        logger.info("Pro edition routes enabled")

    return app


app = create_app()
