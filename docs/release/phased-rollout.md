# Phased Public Rollout

Pact Protocol ships to production in four stages. Production deploys from the **`main`** branch on Vercel. Full development happens on **`develop`**.

## Branches

| Branch | Purpose | Vercel |
|--------|---------|--------|
| `main` | Public production | Production URL |
| `develop` | Integration / full app | Preview URL |

**Workflow:** feature branches → `develop` → PR to `main` when a stage is ready.

## Release Stages

Controlled by `NEXT_PUBLIC_RELEASE_STAGE` on Vercel production:

| Stage | Env value | Public routes | Unlock when |
|-------|-----------|---------------|-------------|
| 1 — Landing | `landing` | `/` | Waitlist live, marketing polish |
| 2 — Demo | `demo` | `/`, `/demo` | Demo video + walkthrough ready |
| 3 — Portal | `portal` | `/`, `/demo`, `/dashboard`, `/agents`, `/matches`, `/deals`, `/metrics`, `/admin` | Creator/brand MVP flows tested |
| 4 — Trading | `trading` | All routes including `/market` | PactTrade MVP ready |

Preview deploys (`develop`) set `NEXT_PUBLIC_SKIP_RELEASE_GATING=true` so all routes remain accessible.

## How to Unlock a Stage

1. Complete and test the stage on `develop`.
2. Open PR: `develop` → `main`.
3. In Vercel → Project → Settings → Environment Variables (Production):
   - Set `NEXT_PUBLIC_RELEASE_STAGE` to the new stage (`demo`, `portal`, or `trading`).
4. Merge PR and verify production deploy.
5. Smoke-test allowed routes; confirm blocked routes redirect to `/`.

## Waitlist

Production landing collects emails via `POST /api/waitlist`.

**Required for production:** Vercel Redis integration (provides `KV_REST_API_URL` and `KV_REST_API_TOKEN`).

**Local dev:** signups append to `ops/waitlist/signups.jsonl` when KV is not configured.

## Vercel Project Setup

1. Import repo from GitHub.
2. Set **Root Directory** to `frontend`.
3. Set **Production Branch** to `main`.
4. Enable preview deploys for `develop`.
5. Add environment variables from `frontend/.env.example`.
6. Add Vercel Redis integration for waitlist storage.

## Middleware

[`frontend/src/middleware.ts`](../frontend/src/middleware.ts) enforces route gating only when:

- `VERCEL_ENV === 'production'`, and
- `NEXT_PUBLIC_SKIP_RELEASE_GATING` is not `true`.

Disallowed routes redirect to `/` with `?soon=<next-stage>`.
