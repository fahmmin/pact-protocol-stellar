# Pact Protocol Pro

Pro extends the OSS core with automation, analytics, and developer API access.

## OSS vs Pro

| Feature | OSS | Pro |
|---------|-----|-----|
| All 5 Soroban contracts | Yes | Yes |
| AI negotiation + matchmaking | Yes | Yes |
| Manual verification UI | Yes | Yes |
| Basic `/metrics` | Yes | Yes |
| Automated KPI scheduler | Manual | Yes (`/pro/scheduler/run`) |
| Deal analytics dashboard | — | Yes (`/pro/analytics/*`) |
| Developer API keys | — | Yes (`X-Pro-API-Key`) |
| Webhooks | — | Yes (`PRO_WEBHOOK_URL`) |
| Prompt edit UI | Read-only | Full admin |
| Multi-tenant Postgres | SQLite | Planned |

## Enabling Pro

### Backend

```bash
export PACT_EDITION=pro
export PRO_API_KEY=your-pro-key
python agents/main.py
```

Optional: `pip install apscheduler` for cron scheduler.

### Frontend

```bash
# frontend/.env.local
NEXT_PUBLIC_PACT_EDITION=pro
```

Routes: `/pro/analytics`

## Licensing

OSS core is [Apache 2.0](../../LICENSE).

Pro modules are included for transparency. Production use of Pro features requires a separate commercial license or hosted Pact service — contact maintainers for enterprise terms.

See [ADR 001](../adr/001-open-core-model.md).

## API

```http
GET /pro/analytics/deals
X-Pro-API-Key: <PRO_API_KEY>

GET /pro/analytics/summary
X-Pro-API-Key: <PRO_API_KEY>

POST /pro/scheduler/run
X-Pro-API-Key: <PRO_API_KEY>
```
