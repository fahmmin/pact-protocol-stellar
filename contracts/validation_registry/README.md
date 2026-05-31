# ValidationRegistry

On-chain artifact logging (deal intents, guidelines, proofs) — ERC-8004 equivalent.

## Public API

- `post_artifact(deal_id, artifact_type, content_hash, uri)`
- `get_deal_artifacts(deal_id)` → Vec
- `get_artifact(artifact_id)`

## Test

```bash
cargo test --package validation_registry
```
