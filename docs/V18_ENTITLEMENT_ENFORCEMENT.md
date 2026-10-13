# V18 — Entitlement Enforcement & CI Hardening

## Summary

v18 completes the central authorization model across every module and
repairs the CI path so PostgreSQL integration tests actually execute.

## Changes

### 1. PostgreSQL integration tests now run (bug fix)

`apps/salecentar/integration/server.mjs` contained a broken email regex on
the `/admin/users` validation path:

    /^\\S+@\\S+\\.\\S+$/.test(input.email)

The double backslashes made the regex require literal backslash characters,
so no valid email could ever match. Every user creation returned
`400 Invalid user`, which failed `auth.db.integration.test.mjs` and
`speech.db.integration.test.mjs` against a live database.

Fixed to `/^\S+@\S+\.\S+$/`.

### 2. Mandatory DB tests in CI (commit e386781)

Removed the `skip:!db` condition from the three integration test files so
CI must run them with a PostgreSQL service. Non-database unit tests remain
runnable standalone via each module's own `npm test`.

### 3. Entitlement enforcement across all modules

`sc_module_entitlements` is now an actual server-side control:

| Module | Protected functionality | Middleware |
|---|---|---|
| Menu Snap | `/api/menus`, `/api/orders` + AI routes (`parse-menu`, `generate-food-photo`, `edit-food-photo`) | `requireEntitlement` |
| ZeroBudget AI | `/api/generate-custom` | `requireEntitlement` before `guardAi` |
| Muse-Flow | all `/api/*` AI endpoints + `/api/integrations/speech` | `requireCentralSession, requireEntitlement` |
| Hermes x402 | `/profit/*`, `/dashboard`, `/` financial routes | optional central-admin path, key path preserved |
| Speech Generator | quota + entitlement (already PostgreSQL-backed, unchanged) | existing |

Behavior: default deny. When `SALECENTAR_AUTH_URL` is unset the middleware
passes through (standalone/dev mode); when configured, a missing or revoked
entitlement returns 403, and an unreachable central service returns 503.

### 4. Central server: hermes-x402 service identity

`server.mjs` recognizes `SALECENTAR_HERMES_SECRET` on
`/internal/auth/introspect` and `/internal/auth/entitlement`, so Hermes
x402 can validate central sessions. The x402 payment protocol itself is
untouched: paid resource routes keep their 402 challenge flow and protocol
clients never need SaleCentar accounts.

## Test results (this machine)

- SaleCentar integration (node --test, live PostgreSQL 16.3): 34/34 pass
- Menu Snap: 4/4 pass, lint + build clean
- ZeroBudget AI: lint + build clean
- Muse-Flow: lint + build clean
- Speech Generator: 7/7 pass, lint + build clean
- Hermes x402 (python unittest): 33/33 pass

## Infrastructure notes

Docker Desktop's backend exits with `0xffffffff` on this host and could not
be repaired without elevated service permissions. PostgreSQL 16.3 was
installed natively (portable binaries, data dir under
`C:/Users/DT User/pgsql16/data`, trust auth bound to 127.0.0.1 only) to run
the integration tests. The staging compose configuration
(`docker-compose.yml`, `nginx/`, `scripts/staging-setup.sh`) is prepared and
validated locally, but has not been deployed to any public host.
