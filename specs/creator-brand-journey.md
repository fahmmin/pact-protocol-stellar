# Creator & Brand Journey

## Creator Journey

1. **Connect wallet** (Freighter, Stellar testnet/mainnet)
2. **Register agent** — mint creator profile with handle, platform, follower count
3. **Submit social verification** — manual proof (screenshot URL, profile link) → oracle review
4. **Onboarding checklist** — wallet ✓, profile ✓, verified ✓, first deal
5. **Dashboard** — Today's actions: deposit stakes, submit delivery, pending oracle
6. **Deal detail** — Guidelines, deliverables, KPI panel, compliance timeline

## Brand Journey

1. Connect wallet → mint brand profile
2. Dashboard — pending deposits, deals awaiting delivery, oracle review queue
3. Create deal with creator (dual-party sign on-chain)
4. Monitor daily KPI checks and guideline compliance
5. Settlement visibility when oracle posts result

## Dashboard Sections (both roles)

| Section | Creator | Brand |
|---------|---------|-------|
| Needs My Action | Deposit, deliver | Deposit stakes |
| Active Deals | status=Active | status=Active |
| Pending Oracle | status=Delivered | status=Delivered |
| Settled | status=Settled/Slashed | same |

## Gating Rules

- Unverified creators: max deal tier Bronze; payment cap 5,000 USDC (6 decimals)
- Verified creators: full tier access per reputation
- Brands: auto-verified at mint; manual review optional for enterprise tier
