# Security Checklist

Status legend:
- `PASS`: implemented and verified in repository/runtime artifacts
- `PARTIAL`: implemented with known gaps
- `FAIL`: missing or incomplete, must be fixed before production

## Smart Contracts

- `PASS` Access control checks exist on privileged functions (`require_auth`) in `contracts/*/src/lib.rs`.
- `PASS` Capital transfer logic is concentrated in `DealVault` and `PactMarket` contract modules.
- `PASS` Unit tests cover core lifecycle paths (28 tests across packages).
- `PASS` `initialize()` re-entry guarded on AgentRegistry, CampaignOracle, DealVault.
- `PASS` Emergency pause controls (`set_paused` / `is_paused`) on AgentRegistry, CampaignOracle, DealVault.
- `PASS` DealVault settlement coupled to CampaignOracle result (one-shot oracle posts).
- `PASS` Deadline enforcement on deposit, delivery; `cancel_deal` and `timeout_settle` paths.
- `PASS` Oracle-only `set_creator_verified` for manual social verification attestation.
- `FAIL` No third-party contract audit report is present.
- `FAIL` No invariant or fuzz test suite exists for economic edge cases.

## Backend Runtime

- `PASS` Health endpoint implemented at `/healthz`.
- `PASS` Metrics endpoint implemented at `/metrics` and `/metrics/summary`.
- `PASS` Admin endpoints protected with `X-API-Key` (`ORACLE_API_KEY`).
- `PASS` Idempotency support on verification submit (`Idempotency-Key` header).
- `PASS` Structured logging via Python `logging` module.
- `PASS` Daily check scheduler API and CLI script (`scripts/agents/run_daily_checks.py`).
- `PARTIAL` `/negotiate` is public; rate limiting not yet implemented.
- `FAIL` No secrets scanner or SAST stage in CI.
- `FAIL` No alerting channel wired to health failures.

## Frontend

- `PASS` Wallet transactions are explicit and user-signed.
- `PASS` Contract addresses are environment-driven.
- `PASS` Role dashboards with task-oriented deal workflow (`/dashboard`).
- `PASS` Manual verification UX and oracle review admin UI (`/admin/review`).
- `PASS` Guideline compliance and daily KPI panels on deal detail.
- `FAIL` No CSP/headers hardening policy is defined.
- `FAIL` No explicit frontend dependency vulnerability scan workflow.

## Ops / Monitoring

- `PASS` Indexer pipeline implemented with persistent SQLite snapshots (`agents/indexer.py`).
- `PASS` Agent runtime SQLite for verification, compliance, prompts (`agents/db.py`).
- `PASS` Invocation evidence and deployment manifest are reproducible with scripts in `scripts/testnet/`.
- `FAIL` No alerting channel (PagerDuty/Slack/email) wired to health failures.
- `FAIL` No incident response playbook beyond baseline runbook.

## Release Gate

This project is **testnet-ready with enterprise UX foundations** but **not mainnet-ready** until external audit, fuzz tests, alerting, and remaining `FAIL` items are resolved.

See `specs/` for product source of truth and `docs/release/readiness-report.md` for deployment gate status.
