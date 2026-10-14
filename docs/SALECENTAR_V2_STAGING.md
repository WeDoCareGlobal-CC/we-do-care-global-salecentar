# SaleCentar V2 — staging checklist

This branch is **not deployed**. Keep AppDeploy production and `main` unchanged.

## Build
```bash
cd apps/salecentar
npm ci
npm run build:v2
node --test integration/v2-session.test.mjs
node --check integration/server.mjs
```

Serve `dist-v2/` as a static SPA and configure a same-origin reverse proxy for `/api/v2/*` to the central integration server on its loopback port.

## Required environment
- `DATABASE_URL`: isolated staging PostgreSQL, never production
- `SALECENTAR_V2_ORIGIN=https://staging.example.org`: exact externally visible HTTPS origin
- Existing integration service configuration required by its startup path
- Never expose the integration port directly to the internet

## Authentication contracts
- `POST /api/v2/login`: JSON `{email,password}`, exact `Origin` header; sets secure session and CSRF cookies
- `GET /api/v2/session`: cookie-authenticated user
- `GET /api/v2/modules`: catalog with server-side entitlement flags
- `POST /api/v2/logout`: exact `Origin` plus `X-CSRF-Token` matching the CSRF cookie

## Gates before staging deployment
1. Pass isolated unit tests and Vite build.
2. Security review: rate limits, proxy header handling, session expiry and CSRF.
3. Configure HTTPS and reverse proxy on a separate staging hostname.
4. Use a staging-only database, bootstrap secret and test user.
5. Run unauthorized/expired session, login/logout, grant/revoke and all five module smoke tests.
6. Verify CSP, cache-control, backup and rollback.
7. Do not merge or redirect the production domain until separately approved.

Known issue: existing GitHub Actions have historically reported `startup_failure`. A newly defined workflow does not prove CI is operational.
