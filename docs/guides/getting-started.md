# Getting Started

This guide walks through running Pact Protocol locally against Stellar Testnet.

## 1. Prerequisites

- Node.js 20+
- Python 3.11+
- Rust + [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools)
- [Freighter](https://www.freighter.app/) browser wallet

## 2. Clone and configure

```bash
git clone https://github.com/pact-protocol/pact-protocol-stellar.git
cd pact-protocol-stellar
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Fill in:

- `GOOGLE_API_KEY` or `ANTHROPIC_API_KEY` for AI negotiation
- Contract IDs (defaults match [deployment manifest](../ops/testnet/deployment-manifest.json))

## 3. Install dependencies

```bash
make install
```

## 4. Verify

```bash
make test
```

## 5. Run locally

```bash
make dev
```

- Frontend: http://localhost:3000
- Agents API: http://localhost:8000
- OpenAPI: http://localhost:8000/docs

## 6. First deal (E2E)

1. Connect Freighter on testnet.
2. **Agents** → register as Creator or Brand.
3. **Matches** → propose/accept a pairing (optional).
4. **Deals** → start AI negotiation → approve terms → create deal on-chain.
5. **Admin / Settlement** → oracle review (requires `ORACLE_API_KEY`).

See [specs/creator-brand-journey.md](../../specs/creator-brand-journey.md) for full workflow.

## Next steps

- [Local development](local-development.md)
- [Architecture overview](../architecture/overview.md)
- [Contributing](../../CONTRIBUTING.md)
