# Agent Runtime API

Interactive docs: **http://localhost:8000/docs** (Swagger UI)

OpenAPI JSON: **http://localhost:8000/openapi.json**

## Authentication

Admin/oracle endpoints require header:

```
X-API-Key: <ORACLE_API_KEY>
```

Pro endpoints require:

```
X-Pro-API-Key: <PRO_API_KEY>
```

## Core endpoints

### Negotiation

```http
POST /negotiate/session
Content-Type: application/json

{
  "creator_id": "1",
  "brand_id": "2",
  "payment_stroops": 1000000,
  "creator_stake_stroops": 100000,
  "brand_stake_stroops": 100000,
  "deadline_ts": 1735689600,
  "kpi_threshold_bps": 500
}
```

Response includes `session.deal_intent_hash` for on-chain `create_deal`.

### Matchmaking

```http
POST /match/propose
{"brand_agent_id": 2, "platform": "youtube", "limit": 5}
```

### Verification

```http
POST /verification/submit
{
  "agent_id": 1,
  "wallet": "G...",
  "platform": "youtube",
  "handle": "creator",
  "proof_url": "https://..."
}
```

### Indexer

```http
GET /indexer/deals?limit=50
POST /indexer/sync
```

### Settlement

```http
POST /oracle/settlement/review
{
  "deal_id": 1,
  "engagement_bps": 650,
  "success": true,
  "reviewer_notes": "KPI met"
}
```

Returns `on_chain_actions` describing Soroban calls for the frontend wallet.

## Frontend client

TypeScript client: [frontend/src/lib/agentApi.ts](../../frontend/src/lib/agentApi.ts)

## Metrics

- `GET /metrics/summary` — JSON
- `GET /metrics` — Prometheus text format
