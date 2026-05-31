# Contributing to Pact Protocol Stellar

Thank you for your interest in contributing. This project is a monorepo spanning Soroban smart contracts, a Python agent runtime, and a Next.js frontend.

## Before You Code

1. Read [specs/README.md](specs/README.md) — product and protocol specs are the source of truth.
2. Read [docs/architecture/overview.md](docs/architecture/overview.md) for system context.
3. Copy [.env.example](.env.example) to `.env` and fill in your testnet keys (never commit `.env`).

## Development Setup

```bash
make install   # install all dependencies
make test      # run contract, agent, and frontend checks
make dev       # start agents + frontend locally
```

See [docs/guides/getting-started.md](docs/guides/getting-started.md) for detailed setup.

## Branch & PR Workflow

- Branch from `main` using `feature/`, `fix/`, or `docs/` prefixes.
- Keep PRs focused — one logical change per PR when possible.
- Update docs when you change behavior, APIs, or env vars.

## PR Checklist

- [ ] Specs or ADRs updated if behavior or architecture changed
- [ ] `make test` passes locally
- [ ] No secrets, `.env`, or private keys committed
- [ ] Contract changes: `cd contracts && stellar contract build && cargo test`
- [ ] Agent changes: smoke tests pass (`cd agents && pytest`)
- [ ] Frontend changes: `cd frontend && npm run lint && npm run build`

## Critical Rules (Contracts)

- Build with `stellar contract build` — not `cargo build --target wasm32-unknown-unknown`.
- Every capital state change goes through **DealVault**.
- Oracle-only writes for reputation and settlement.
- Both parties must sign `create_deal`.
- Keep `soroban-sdk = "21.7.6"` unless explicitly tested and approved.

## Code Style

- **Rust:** follow existing patterns in each contract crate; run `cargo fmt`.
- **Python:** follow existing module layout under `agents/pact/`; use type hints.
- **TypeScript:** match existing App Router and `lib/` conventions.

## Reporting Issues

- Bug reports: include network (testnet), contract IDs, tx hash, and steps to reproduce.
- Security issues: see [SECURITY.md](SECURITY.md) — do not open public issues for vulnerabilities.

## Pro Tier Contributions

Pro modules live under `agents/pro/` and `frontend/src/features/pro/`. See [docs/pro/README.md](docs/pro/README.md) for the open-core boundary and licensing.
