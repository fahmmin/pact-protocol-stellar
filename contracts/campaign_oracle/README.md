# CampaignOracle

Authorized signer posts social/metric outcomes per deal.

## Public API

- `initialize(signer)`
- `post_result(deal_id, engagement_bps, views, success)` — signer auth
- `get_result(deal_id)`, `has_result(deal_id)`

## Test

```bash
cargo test --package campaign_oracle
```
