# Pact Protocol Stellar

[![CI](https://github.com/pact-protocol/pact-protocol-stellar/actions/workflows/ci.yml/badge.svg)](https://github.com/pact-protocol/pact-protocol-stellar/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Stellar Testnet](https://img.shields.io/badge/Network-Testnet-7D00FF)](https://stellar.expert/explorer/testnet)

> Every deal, proven on-chain. Now on Stellar.

Pact Protocol is a trustless creator–brand deal platform on **Stellar/Soroban**. AI agents negotiate campaigns off-chain, terms are hashed and escrowed on-chain via **DealVault**, outcomes are verified by an oracle, and **PactMarket** enables binary YES/NO prediction trading on campaign results.

**Demo video:** [YouTube pitch](https://youtu.be/yGr_Yi7kSV4)

---

## Why Pact Protocol?

| Problem | Solution |
|---------|----------|
| Trust deficit between creators and brands | Capital locked in DealVault until oracle settlement |
| Manual negotiation overhead | AI agent runtime with multi-turn sessions |
| Opaque campaign metrics | On-chain artifacts + oracle attestation |
| No community upside | PactMarket prediction AMM on deal outcomes |

---

## Architecture

```
contracts/     Soroban smart contracts (Rust)
agents/        Python FastAPI agent runtime (negotiation, oracle ops)
frontend/      Next.js 14 App Router UI
packages/      Shared config + types
specs/         Product/protocol specifications (source of truth)
docs/          Architecture, guides, API reference
```

See [docs/architecture/overview.md](docs/architecture/overview.md) for the full system diagram.

### Smart Contracts (Testnet)

| Contract | Address |
|----------|---------|
| Agent Registry | `CBIORX6H6LNFVJZDDR5VRIK2SMS33F65NLAZXXUVIJCWDGQYFQBI3AMB` |
| Validation Registry | `CCLSZGX22VETSIMFE27NXO4KOPLJOHRTRLGQTDJVBSX3IWRQCPIXSKWA` |
| Campaign Oracle | `CANGGB2JIORNUTNWWMWCORYKHMYBO64BEC464RLX2WIDFTD772PAUE2E` |
| Deal Vault | `CBYJ4ZCAUBOKLLGYE4JLHBUOGCHLB4IA56G6JQH2DF5E5UCZWEULUIDZ` |
| Pact Market | `CCTXVX6LYNHPL2XJHNOTXKJ33IOY7BYLPMN7SHMV6X2YW7LBPYNG2I4E` |

Canonical addresses live in [ops/testnet/deployment-manifest.json](ops/testnet/deployment-manifest.json).

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Rust + [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools)
- Freighter wallet (browser extension)

### Setup

```bash
git clone https://github.com/pact-protocol/pact-protocol-stellar.git
cd pact-protocol-stellar
cp .env.example .env          # fill in API keys and contract IDs
make install
make test
make dev                      # agents :8000 + frontend :3000
```

Detailed guide: [docs/guides/getting-started.md](docs/guides/getting-started.md)

### Individual components

```bash
# Contracts
cd contracts && stellar contract build && cargo test

# Agents
cd agents && pip install -r requirements.txt && python main.py

# Frontend
cd frontend && npm install && npm run dev
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | Documentation index |
| [specs/README.md](specs/README.md) | Protocol specifications |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [docs/pro/README.md](docs/pro/README.md) | Open-core Pro tier |
| [docs/community/user-feedback.md](docs/community/user-feedback.md) | Community beta feedback |

---

## Open-Core Model

The **OSS core** (Apache 2.0) includes all contracts, negotiation, matchmaking, verification, and basic metrics. **Pro** features (analytics, automated scheduler, API keys, webhooks) are gated by `PACT_EDITION=pro`. See [docs/adr/001-open-core-model.md](docs/adr/001-open-core-model.md).

---

## Operations

- Testnet runbook: [docs/operations/testnet-runbook.md](docs/operations/testnet-runbook.md)
- Security checklist: [docs/security/security-checklist.md](docs/security/security-checklist.md)
- Release gates: [docs/release/mainnet-safety-gates.md](docs/release/mainnet-safety-gates.md)

---

## Community

- [Community feedback form](https://docs.google.com/forms/d/e/1FAIpQLSf09nG7PYFjWAdHDeJPWVD3GoN9K7BYzOyycXLBdBz8_nI2rA/viewform)
- Report security issues: [SECURITY.md](SECURITY.md)

---

Built for the Stellar network.
