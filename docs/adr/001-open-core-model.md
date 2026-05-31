# ADR 001: Open-Core Model

## Status

Accepted — 2026-06-01

## Context

Pact Protocol will be open-sourced while reserving commercial features for hosted Pro/Enterprise offerings.

## Decision

Adopt an **open-core** model:

- **OSS core** (Apache 2.0): all Soroban contracts, negotiation, matchmaking, verification, basic metrics, testnet tooling.
- **Pro layer** (separate license / commercial): automated scheduler, analytics dashboard, developer API keys, webhooks, multi-tenant Postgres, managed hosting.

Pro code lives in-repo (`agents/pro/`, `frontend/src/features/pro/`) for transparency but is gated by environment flags:

- Backend: `PACT_EDITION=pro`
- Frontend: `NEXT_PUBLIC_PACT_EDITION=pro`

## Consequences

- Contributors can fork and run the full testnet demo without Pro keys.
- Pro modules are visible for audit but require `PRO_API_KEY` and commercial license for production use.
- No payment/billing integration in OSS — Pro is structural + feature-gated only.

## Alternatives considered

- Fully proprietary: rejected — limits Stellar ecosystem adoption.
- Fully open without Pro: rejected — no path to sustainable ops/hosting revenue.
