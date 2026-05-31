# Pact Protocol — Product & Protocol Specifications

Source of truth for implementation. Read before writing contract, agent, or frontend code.

| Spec | Description |
|------|-------------|
| [creator-brand-journey.md](./creator-brand-journey.md) | Role-specific onboarding and daily workflows |
| [guideline-lifecycle.md](./guideline-lifecycle.md) | Deal guidelines, deliverables, compliance checkpoints |
| [manual-verification.md](./manual-verification.md) | Social proof submission and oracle attestation (Phase 1) |
| [daily-metric-checks.md](./daily-metric-checks.md) | KPI polling, review queue, settlement readiness |
| [profile-mutability.md](./profile-mutability.md) | Editable vs locked profile fields |
| [prompt-persona-governance.md](./prompt-persona-governance.md) | AI negotiation prompts and persona switching |

## Phase 1 Scope (locked)

- **Product-first** UX for creators and brands
- **Manual review + oracle attestation** for social verification (OAuth in Phase 2)
- Minimum **mainnet safety gates** before production deploy

## Contract References

| Contract | Responsibility |
|----------|----------------|
| AgentRegistry | Identity, reputation, verification status |
| ValidationRegistry | On-chain artifact logging (guidelines, proofs) |
| DealVault | Escrow, lifecycle, settlement |
| CampaignOracle | Metric results and settlement truth |
| PactMarket | YES/NO prediction AMM |
