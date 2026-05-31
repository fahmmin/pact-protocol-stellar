# Branch Strategy

Production deploys from **`main`**. All product development happens on **`develop`**.

## Branches

| Branch | Contents | Vercel |
|--------|----------|--------|
| `main` | Landing page only (`/`, waitlist API) | Production URL |
| `develop` | Full app — dashboard, deals, agents, market, admin, demo | Preview URL |

**Workflow:** feature branches → `develop` → PR to `main` when the full product is ready to ship.

There is no release-stage middleware or route gating. What is on each branch is what deploys.

## Shipping the full product

1. Finish and test everything on `develop`.
2. Open PR: `develop` → `main`.
3. Merge and verify the production deploy.
4. Smoke-test all routes on production.

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
