# Agent Runtime Architecture

The agent runtime (`agents/pact/`) is a FastAPI service that coordinates off-chain AI negotiation, indexing, verification queues, and oracle settlement recommendations.

## Package Layout

```
agents/pact/
├── api/
│   ├── main.py          # App factory
│   ├── routers/         # HTTP routes by domain
│   └── schemas.py       # Pydantic models
├── services/
│   ├── orchestration.py # Negotiation sessions
│   ├── matchmaker.py    # Creator-brand matching
│   ├── scheduler.py     # Daily KPI checks
│   └── stellar_ops.py   # On-chain action descriptors
├── db/
│   └── repositories/    # SQLite persistence
└── integrations/
    ├── llm.py           # Gemini / Anthropic
    └── stellar/         # Indexer sync via Stellar CLI
```

## Negotiation Flow

1. `POST /negotiate/session` — create session with deal terms; compute `deal_intent_hash`.
2. Multi-turn rounds via `/negotiate/session/{id}/round`.
3. Both parties approve via `/negotiate/session/{id}/approve`.
4. Frontend submits `create_deal` on-chain with the hash.

## Oracle Ops

- Verification queue: `/verification/submit`, `/verification/review/{id}`
- Settlement: `/oracle/settlement/review`
- Admin prompts: `/admin/prompts` (Pro: full edit UI)

## Indexer

`POST /indexer/sync` pulls AgentRegistry + DealVault state into SQLite for search/match.

Startup runs a best-effort sync; failures are logged and skipped.

## Pro Extensions

When `PACT_EDITION=pro`, routes under `/pro/*` register (analytics, scheduler run, API keys).

See [docs/pro/README.md](../pro/README.md).

## Running

```bash
cd agents && python main.py
# OpenAPI: http://localhost:8000/docs
```
