# Local Development

## Monorepo commands

```bash
make install    # all dependencies
make test       # contracts + agents + frontend
make dev        # agents + frontend concurrently
make build      # production builds
```

## Contracts

```bash
cd contracts
stellar contract build
cargo test
cargo test --package deal_vault
```

Always use `stellar contract build` (target `wasm32v1-none`).

## Agents

```bash
cd agents
pip install -r requirements.txt
pytest tests/ -v
python main.py
```

Package entry: `pact.api.main:app`

Pro mode: `PACT_EDITION=pro PRO_API_KEY=secret python main.py`

## Frontend

```bash
cd frontend
npm run dev
npm run lint
npm run build
```

## Database locations

| Service | Path |
|---------|------|
| Agent runtime | `ops/agents/pact_agents.db` |
| Standalone indexer | `ops/indexer/pact_indexer.db` |

## Specs first

Read [specs/README.md](../../specs/README.md) before changing behavior.
