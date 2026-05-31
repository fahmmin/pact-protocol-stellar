# AgentRegistry

Creator and brand identity, verification status, and reputation scoring.

## Public API

- `initialize(oracle)` — set oracle address
- `mint_creator(wallet, handle, platform, follower_count, metadata_uri)` → agent_id
- `mint_brand(wallet, brand_name, metadata_uri)` → agent_id
- `set_creator_verified(agent_id, verified)` — oracle only
- `update_creator_profile` / `update_brand_profile`
- `record_deal(agent_id, success, engagement_bps)` — oracle only
- `get_profile(agent_id)`, `get_score(agent_id)`, `agent_count()`

## Test

```bash
cargo test --package agent_registry
```
