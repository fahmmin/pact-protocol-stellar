# Soroban Contracts Workspace

Five Soroban smart contracts for Pact Protocol on Stellar.

## Build

```bash
stellar contract build   # NOT cargo build --target wasm32-unknown-unknown
cargo test
```

SDK: `soroban-sdk = "21.7.6"` (do not bump without full test pass).

## Crates

| Crate | Description |
|-------|-------------|
| [agent_registry](agent_registry/README.md) | Identity, verification, reputation |
| [validation_registry](validation_registry/README.md) | On-chain artifacts |
| [deal_vault](deal_vault/README.md) | Escrow and settlement |
| [campaign_oracle](campaign_oracle/README.md) | Metric results |
| [pact_market](pact_market/README.md) | Prediction AMM |

## Deploy

See [docs/guides/deploy-testnet.md](../docs/guides/deploy-testnet.md).

WASM output: `target/wasm32v1-none/release/*.wasm`

## Rules

- All capital through **DealVault**
- Oracle-only reputation/settlement writes
- Dual auth on `create_deal`
