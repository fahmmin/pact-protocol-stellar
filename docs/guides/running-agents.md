# Running the Agent Runtime

## Start

```bash
cd agents
python main.py
```

Port defaults to `8000` (`AGENT_RUNTIME_PORT`).

## Key environment variables

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `gemini` or `anthropic` |
| `GOOGLE_API_KEY` | Gemini API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `ORACLE_API_KEY` | Admin endpoint auth |
| `CORS_ORIGINS` | Frontend origin(s) |
| `PACT_EDITION` | `oss` or `pro` |
| `PRO_API_KEY` | Pro API routes (when pro) |

Contract IDs load from env, falling back to [deployment manifest](../../ops/testnet/deployment-manifest.json).

## Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /healthz` | — | Health check |
| `POST /negotiate/session` | — | Start negotiation |
| `GET /agents/search` | — | Search indexed agents |
| `POST /verification/submit` | — | Submit social proof |
| `POST /verification/review/{id}` | API key | Oracle review |
| `POST /indexer/sync` | API key | Sync chain state |

Full list: http://localhost:8000/docs

## Daily checks

Manual trigger:

```bash
curl -X POST http://localhost:8000/scheduler/daily-checks \
  -H "X-API-Key: $ORACLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deals":[{"deal_id":1,"engagement_bps":600}]}'
```

Pro: automated via `POST /pro/scheduler/run`.

## Cron script

```bash
python scripts/agents/run_daily_checks.py
```
