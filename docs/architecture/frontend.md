# Frontend Architecture

Next.js 14 **App Router** with route groups.

## Branches

| Branch | Routes |
|--------|--------|
| `main` | `(marketing)/` — landing page and waitlist only |
| `develop` | `(marketing)/` + `(app)/` — dashboard, deals, agents, market, admin, demo |

See [branch strategy](../release/phased-rollout.md).

## Layers (develop)

| Path | Purpose |
|------|---------|
| `src/app/` | Routes and page composition |
| `src/components/` | Shared UI (NavBar, cards, TxStatus) |
| `src/hooks/` | React Query data hooks |
| `src/lib/` | Soroban RPC, contract tx builders, agent API client |
| `src/store/` | Zustand wallet + tx state |
| `src/features/pro/` | Pro-gated UI |

## On-Chain vs Off-Chain

- **Wallet (Freighter):** signs all capital transactions.
- **Agent API:** negotiation, verification, metrics — no private keys on server.
- **Soroban RPC:** read contract state; simulate + submit txs.

## Data Fetching

React Query hooks (`useDeals`, `useAgents`, `useVerificationRequests`) wrap `lib/agentApi.ts`.

Indexed deals from `/indexer/deals` reduce blind ID scanning.

## Environment

Copy [frontend/.env.example](../../frontend/.env.example) to `frontend/.env.local`.

Contract IDs must match [deployment manifest](../../ops/testnet/deployment-manifest.json).

## Pro UI

Set `NEXT_PUBLIC_PACT_EDITION=pro` to expose `/pro/analytics` and related routes (develop only).

Components use `ProGate` to hide Pro content in OSS builds.
