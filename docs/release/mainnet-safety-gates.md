# Mainnet Safety Gates

Checklist before promoting beyond testnet. Items marked **DONE** in this release.

## Contract Hardening

| Gate | Status |
|------|--------|
| `initialize()` cannot be called twice | **DONE** |
| Emergency pause on privileged contracts | **DONE** |
| Deal deadlines enforced | **DONE** |
| Cancel / timeout settlement paths | **DONE** |
| Settlement reads CampaignOracle result | **DONE** |
| One-shot oracle results | **DONE** |
| Slashed status on failure | **DONE** |
| External smart contract audit | Pending |
| Fuzz / invariant tests on capital paths | Pending |

## Backend Hardening

| Gate | Status |
|------|--------|
| API key auth on admin/oracle endpoints | **DONE** |
| Idempotency on verification submit | **DONE** |
| Structured logging | **DONE** |
| Daily check scheduler | **DONE** |
| Rate limiting on public endpoints | Pending |
| Secret manager (not env files) | Pending |

## Before Mainnet Deploy

1. Redeploy all contracts with updated WASM (breaking: `DealVault.initialize` adds `campaign_oracle`, `settle` drops `success` arg).
2. Run full invocation matrix on fresh deployment.
3. Complete external audit.
4. Wire alerting to `/healthz` failures.
5. Set `ORACLE_API_KEY` in production; never leave unset on mainnet.
