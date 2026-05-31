# Manual Social Verification (Phase 1)

OAuth deferred to Phase 2. Phase 1 uses human review + on-chain attestation.

## Flow

1. Creator submits verification request via agent API:
   - `agent_id`, `platform`, `handle`, `proof_url`, `notes`
2. Request enters `pending` queue (SQLite)
3. Oracle operator reviews in `/admin/review` UI or API
4. On approve:
   - Agent runtime calls `AgentRegistry.set_creator_verified(agent_id, true)` (oracle signer)
   - Optional ValidationRegistry artifact logged
5. On reject: status `rejected` with reason; creator may resubmit

## Proof Requirements

- Public profile URL matching registered handle/platform
- Screenshot or video proof of account ownership (stored off-chain URL)
- Follower count within 20% of claimed count (manual check)

## Frontend

- Verification badge on AgentCard and profile
- "Submit for verification" on creator profile when `verified=false`
- Gating message when creating high-value deals without verification

## Security

- Review endpoints require `X-API-Key` matching `ORACLE_API_KEY`
- Public submit endpoint rate-limited; idempotency via `Idempotency-Key` header
