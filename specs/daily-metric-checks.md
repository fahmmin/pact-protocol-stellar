# Daily Metric Checks & Settlement Policy

## Scheduler (agent runtime)

- Cron: daily at 00:00 UTC (configurable `DAILY_CHECK_HOUR_UTC`)
- For each deal with status Active or Delivered:
  1. Record snapshot: likes, views, engagement_bps (manual input or future API)
  2. Compare against deal KPI threshold (stored in deal metadata off-chain)
  3. Create review task if below threshold or deadline within 24h

## Settlement Readiness

| Deal status | Oracle action |
|-------------|---------------|
| Delivered | Post result to CampaignOracle; call DealVault.settle |
| Active + past deadline | timeout_settle (failure or partial per policy) |
| Pending + past deadline | cancel_deal refund path |

## KPI Panel (frontend)

- Latest engagement_bps from CampaignOracle (if posted)
- Daily check history from agent API
- Countdown to deadline
- Settlement readiness badge: Not Ready | Under Review | Ready

## Engagement Threshold (default)

- Success: `engagement_bps >= 500` (5%) unless deal-specific override
- Oracle may override with documented reason in review notes
