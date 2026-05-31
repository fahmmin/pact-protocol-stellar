# Pact Agent Runtime

Python FastAPI service for AI negotiation, matchmaking, verification, and oracle ops.

## Quick start

```bash
pip install -r requirements.txt
python main.py
```

OpenAPI: http://localhost:8000/docs

## Structure

```
pact/
├── api/routers/     # HTTP endpoints
├── services/        # Business logic
├── db/repositories/ # SQLite
└── integrations/    # LLM + Stellar indexer

pro/                 # Pro tier (PACT_EDITION=pro)
tests/               # Smoke tests
```

## Tests

```bash
pytest tests/ -v
```

## Config

Reads repo-root `.env`. Contract addresses from env or [deployment manifest](../ops/testnet/deployment-manifest.json).

## Docs

- [docs/architecture/agents-runtime.md](../docs/architecture/agents-runtime.md)
- [docs/guides/running-agents.md](../docs/guides/running-agents.md)
