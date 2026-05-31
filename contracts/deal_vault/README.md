# DealVault

Core escrow engine: USDC payment, dual stakes, lifecycle, oracle settlement.

## Public API

- `initialize(usdc, oracle, treasury, fee_bps)`
- `create_deal(...)` — requires creator + brand auth
- `deposit_stakes(deal_id)`
- `submit_delivery(deal_id)`
- `settle(deal_id)` — reads CampaignOracle result
- `cancel_deal(deal_id)`, `timeout_settle(deal_id)`
- `get_deal(deal_id)`

## Test

```bash
cargo test --package deal_vault
```

## Critical

Never bypass DealVault for USDC in deal flows.
