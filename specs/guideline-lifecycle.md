# Guideline Lifecycle

## Artifact Types (ValidationRegistry)

| Type | Posted by | When |
|------|-----------|------|
| DealIntent | Creator or Brand | Deal creation / negotiation |
| RiskCheckpoint | Brand | After stakes deposited |
| ContentSubmission | Creator | On delivery |
| SettlementAttestation | Oracle | On settlement |

## Compliance Checkpoints

1. **Guideline acceptance** — Brand posts RiskCheckpoint artifact; creator acknowledges (off-chain UI + optional artifact)
2. **Content delivery** — Creator submits delivery on DealVault + ContentSubmission artifact
3. **Daily KPI review** — Agent runtime records metrics; oracle reviews before settlement
4. **Settlement** — Oracle posts CampaignOracle result + SettlementAttestation artifact; DealVault settles using oracle truth

## Violation Escalation

| Level | Action |
|-------|--------|
| Warning | Remediation window (48h default) |
| Non-compliance | Oracle marks failure; 20% creator stake slash |
| Timeout | After deadline, oracle may timeout_settle |

## UI Requirements

- Deal detail shows checklist per artifact type
- Responsible actor labeled (Creator / Brand / Oracle)
- Status: missing | submitted | attested
