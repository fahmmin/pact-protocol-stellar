# Pact Frontend

Next.js 14 App Router UI for Pact Protocol on Stellar.

## Branches

| Branch | Scope |
|--------|-------|
| `main` | Landing page + waitlist API (production) |
| `develop` | Full product UI — dashboard, deals, agents, market, admin |

See [docs/release/phased-rollout.md](../docs/release/phased-rollout.md) for the branch workflow.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Structure (main branch)

```
src/
├── app/(marketing)/   # Landing page
├── app/api/waitlist/  # Email signup API
├── components/landing/
├── components/seo/
├── lib/               # SEO, waitlist, contract addresses
└── styles/
```

On `develop`, additional route groups and app components are present under `(app)/`.

## Environment

See [.env.example](.env.example). Contract IDs must match deployment manifest.

## Docs

- [docs/architecture/frontend.md](../docs/architecture/frontend.md)
- [docs/guides/getting-started.md](../docs/guides/getting-started.md)
