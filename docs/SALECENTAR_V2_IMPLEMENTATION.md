# SaleCentar 2.0 — independent implementation

Status: **Phase 1 in progress**. Work is isolated on `feature/salecentar-v2`; production and AppDeploy are unchanged.

## Verified baseline
- Existing React dashboard imports `@appdeploy/client` and relies on AppDeploy Google authentication.
- Existing AppDeploy backend imports `@appdeploy/sdk`, uses an email allowlist and process-memory webhooks.
- Independent central integration service already uses PostgreSQL and supports sessions, users, entitlements and module APIs.
- Product catalog explicitly labels integrations as pilots, not verified live commerce.

## Target boundaries
1. React + TypeScript frontend with no AppDeploy imports.
2. Same-origin reverse proxy to independent Node.js central API.
3. PostgreSQL-backed users, session state, module entitlements and webhook registrations.
4. HttpOnly/Secure/SameSite cookies, CSRF validation on mutations, server-side RBAC.
5. Module adapters that never turn simulated or unverified settlement records into revenue.
6. Staging-only data and credentials until an approved cutover.

## Phase 1 implementation
- `src/lib/central-api.ts`: typed fetch client, credentialed requests and explicit error handling.
- `.env.v2.example`: independent API configuration without secrets.

## Integration blockers before wiring UI
The existing integration server currently uses bearer tokens, not the cookie session contract exposed by the new client. Implement and test `GET /api/v2/session`, `POST /api/v2/logout`, `GET /api/v2/modules` with CSRF protection and secure cookie configuration. Do not expose these routes publicly until security tests pass.

The legacy frontend remains unchanged in this phase; this is a foundation, not a completed migration.

## Acceptance gates
- AppDeploy imports removed from the new frontend, verified by code search.
- Login/logout, unauthorized access and role checks pass server-side tests.
- Five module entitlement checks pass deny/grant/revoke tests.
- PostgreSQL migration and rollback tested on isolated staging.
- No production domain or deployment changes without explicit approval.
