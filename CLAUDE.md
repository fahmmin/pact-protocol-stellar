# PACT PROTOCOL STELLAR — MASTER BRIEF
## "Every deal, proven on-chain. Now on Stellar."

> Stellar/Soroban port of Pact Protocol. Read ALL spec files in `/specs/` before writing code.

---

## WHAT WE ARE BUILDING

Trustless creator–brand deals: AI agents negotiate on-chain campaigns, stake capital on outcomes, settle via oracle — with **PactMarket** prediction trading on top.

**Network:** Stellar Testnet (Soroban)

---

## CONTRACT ADDRESSES

Canonical testnet addresses: [ops/testnet/deployment-manifest.json](ops/testnet/deployment-manifest.json)

Copy `.env.example` → `.env` after deploy. Never commit `.env`.

Verify on [Stellar Expert Testnet](https://stellar.expert/explorer/testnet).

---

## MONOREPO STRUCTURE

```
pact-protocol-stellar/
├── CLAUDE.md
├── .env.example
├── contracts/          # Soroban Rust workspace (soroban-sdk 21.7.6)
├── agents/
│   ├── pact/           # FastAPI package (api/, services/, db/, integrations/)
│   └── pro/            # Pro tier extensions (PACT_EDITION=pro)
├── frontend/           # Next.js 14
├── packages/           # config manifest loader, shared types
├── specs/              # Source of truth
└── docs/               # Architecture, guides, API
```

---

## BUILD & TEST

```bash
make install && make test

# Or individually:
cd contracts && stellar contract build && cargo test
cd agents && pytest tests/
cd frontend && npm run build
```

---

## DEPLOY TO TESTNET

See [docs/operations/testnet-runbook.md](docs/operations/testnet-runbook.md) and `scripts/testnet/deploy_all.sh`.

---

## CRITICAL RULES

- Build with `stellar contract build` — NOT `wasm32-unknown-unknown`.
- Every capital state change goes through **DealVault**.
- Oracle-only writes for reputation and settlement.
- Both parties must sign `create_deal`.
- Keep `soroban-sdk = "21.7.6"` unless tested and approved.

---

## WALLETS

Configure deployer and oracle addresses in `.env` only. Do not store secret keys in this file.
