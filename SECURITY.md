# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x (testnet) | Yes — security reports welcome |

This project is currently deployed on **Stellar Testnet only**. Do not use testnet contracts or keys on mainnet.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately by emailing the maintainers or using GitHub's private vulnerability reporting (if enabled). Include:

- Description of the vulnerability
- Steps to reproduce
- Affected components (contracts, agents, frontend)
- Potential impact

We aim to acknowledge reports within 72 hours.

## What Not to Commit

Never commit these to the repository:

- `.env` files with live API keys or oracle credentials
- Stellar secret keys or seed phrases
- `ORACLE_API_KEY` production values
- Private deployment wallets

Use [.env.example](.env.example) as the template. See [docs/guides/getting-started.md](docs/guides/getting-started.md).

## Smart Contract Security

- All capital flows must go through **DealVault** — never bypass escrow.
- Oracle settlement requires authorized signer — see [docs/security/security-checklist.md](docs/security/security-checklist.md).
- Review [docs/release/mainnet-safety-gates.md](docs/release/mainnet-safety-gates.md) before any mainnet deployment.

## Agent Runtime Security

- Admin endpoints (`/admin/*`, `/indexer/sync`, `/scheduler/*`, `/oracle/*`) require `X-API-Key` matching `ORACLE_API_KEY`.
- Do not expose `ORACLE_API_KEY` in client-side frontend code in production.
