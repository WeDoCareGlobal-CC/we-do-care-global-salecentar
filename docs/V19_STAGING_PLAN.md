# v19 Plan — Staging Deployment & End-to-End Verification

**Status: v18 = development-complete, NOT production-ready.**
This document is a plan only. No deployment has been executed.
Production deployment requires explicit approval.

## Why v18 is not production-ready

1. **CI has never run** — GitHub Actions blocked (see CI_BLOCKED.md);
   all verification is local-only.
2. **No staging environment exists** — compose config is prepared
   (docker-compose.yml, nginx/nginx.conf, scripts/staging-setup.sh) but
   has never been built or deployed.
3. **No cross-module E2E test against real services** — entitlement
   enforcement is verified against the central server's internal
   endpoints; module servers (Menu Snap, ZeroBudget AI, Muse-Flow,
   Speech Generator) have never run together with central auth wired.
4. **Backup/restore verified only on local PostgreSQL** — not against
   the compose stack.
5. **No live provider verification** — Gemini, speech provider, x402
   settlement all unverified with real credentials.

## v19 Scope

### Phase 1 — Staging infrastructure
- Target: single staging host (VPS or Cloudflare-adjacent VM) with Docker
  Engine working (Docker Desktop is unusable on the dev machine — see
  V18 doc; CI runner or VPS required)
- Build all 6 images from the committed Dockerfiles
- `docker compose up` with staging env (unique secrets per module,
  no legacy admin, NODE_ENV=production)
- Verify: every container healthy, restart policies active

### Phase 2 — HTTPS & reverse proxy
- Terminate TLS at nginx (committed nginx/nginx.conf) with a real cert
  (Let's Encrypt or Cloudflare Origin cert — needs DNS access)
- Internal-only service networking; only nginx exposed
- Health checks reachable through the proxy

### Phase 3 — Real cross-module E2E tests
Against the running staging stack:
1. Central login → token issued
2. Grant entitlement per module → module access allowed
3. Each module server called with the central token → entitlement
   enforced (default deny, grant, revoke, wrong secret, invalid token)
4. Speech Generator quota end-to-end (central reserve/finish)
5. Menu Snap menu CRUD gated by entitlement
6. ZeroBudget AI generate-custom gated by entitlement
7. Muse-Flow AI endpoints + speech bridge gated by entitlement
8. Hermes x402 financial routes: admin key path AND central-admin path;
   402 payment challenge flow untouched

### Phase 4 — Backup / restore / rollback
- `pg_dump -F c` from staging PostgreSQL → restore into a fresh isolated
  database → row-count + integrity verification (pattern proven locally)
- Documented rollback: previous image tags pinned, compose rollback
  procedure, DB migration reversibility notes

### Phase 5 — Release gates re-execution
Re-run all ten v15 gates against the real staging stack; record
PASS/FAIL/BLOCKED with evidence per gate.

## Blockers requiring owner action

| Blocker | Owner action needed |
|---|---|
| GitHub Actions | `gh auth refresh -s admin:org` or add payment method (see CI_BLOCKED.md) |
| Docker on dev host | Elevated shell, or use CI/VPS for builds |
| Staging host | Provision a VPS or equivalent |
| TLS certificates | DNS control for a staging domain |
| Provider credentials | Gemini key, speech provider key, x402 private key (staging-only, never committed) |

## Explicitly out of scope for v19

- Real payments / live settlement activation
- Production domain cutover
- Public exposure of any service before security review
