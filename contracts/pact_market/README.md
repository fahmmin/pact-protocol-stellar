# PactMarket

Binary YES/NO prediction AMM per deal, settled by oracle outcome.

## Public API

- `initialize(usdc, oracle)`
- `create_market(deal_id, initial_liquidity)`
- `buy(buyer, deal_id, is_yes, usdc_in)` → tokens out
- `get_yes_price(deal_id)`
- `settle_market(deal_id, outcome)`
- `redeem(redeemer, deal_id)`
- `get_market(deal_id)`

## Test

```bash
cargo test --package pact_market
```
