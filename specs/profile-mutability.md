# Profile Mutability Rules

## Always Editable (no active deals)

| Field | Creator | Brand |
|-------|---------|-------|
| handle / brand_name | ✓ | ✓ |
| platform | ✓ | — |
| metadata_uri | ✓ | ✓ |
| follower_count | ✓ | — |

## Locked During Active Deals

When creator or brand has any DealVault deal in status Pending, Active, or Delivered:

- **Creator**: platform and follower_count locked (prevents bait-and-switch)
- **Brand**: brand_name locked
- **Both**: wallet address immutable (on-chain)

Enforcement:
- Frontend disables locked fields + shows lock icon
- Agent API rejects profile update requests if active deals exist (off-chain index)
- On-chain updates still allowed but UI warns — full on-chain lock requires cross-contract read (future)

## Verification Status

- Only oracle may set `verified=true` for creators via `set_creator_verified`
- Creators cannot self-set verified

## Change History

- Agent runtime logs profile change events to SQLite `profile_audit` table
- UI shows last 10 changes with timestamp
