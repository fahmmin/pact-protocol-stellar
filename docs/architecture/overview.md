# System Overview

Pact Protocol Stellar connects three layers: **Soroban contracts** (capital + truth), a **Python agent runtime** (negotiation + oracle ops), and a **Next.js frontend** (wallet UX).

## High-Level Diagram

```mermaid
flowchart TB
  User[User / Brand / Creator]
  FE[Next.js Frontend]
  Agents[FastAPI Agent Runtime]
  RPC[Soroban RPC]
  AR[AgentRegistry]
  VR[ValidationRegistry]
  DV[DealVault]
  CO[CampaignOracle]
  PM[PactMarket]

  User --> FE
  FE --> Agents
  FE --> RPC
  Agents --> RPC
  RPC --> AR
  RPC --> VR
  RPC --> DV
  RPC --> CO
  RPC --> PM
  DV --> CO
```

## End-to-End Deal Flow

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Agents as AgentsRuntime
  participant RPC as SorobanRPC
  participant Vault as DealVault
  participant Oracle as CampaignOracle

  User->>Frontend: Connect wallet, register agent
  Frontend->>RPC: mint_creator / mint_brand
  User->>Frontend: Start negotiation
  Frontend->>Agents: POST /negotiate/session
  Agents-->>Frontend: deal_intent_hash + terms
  User->>Frontend: Both parties approve terms
  Frontend->>RPC: create_deal + deposit_stakes
  Frontend->>RPC: post_artifact (optional)
  Agents->>Agents: Daily KPI check
  User->>Frontend: Oracle settlement review
  Frontend->>RPC: post_result + settle
```

## Trust Boundaries

| Layer | Trust model |
|-------|-------------|
| DealVault | Both parties sign; funds escrowed on-chain |
| CampaignOracle | Only authorized signer posts results |
| Agent runtime | Off-chain coordination; does not hold funds |
| Frontend | User wallet signs all capital txs |

## Configuration

Contract addresses: [ops/testnet/deployment-manifest.json](../../ops/testnet/deployment-manifest.json)

Environment template: [.env.example](../../.env.example)

## Related Docs

- [contracts.md](contracts.md)
- [agents-runtime.md](agents-runtime.md)
- [frontend.md](frontend.md)
