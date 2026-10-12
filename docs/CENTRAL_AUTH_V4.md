# We Do Care Global SaleCentar — Central access v4

## Implemented
- PostgreSQL `sc_users` and `sc_sessions`, password hashing with Node scrypt and random salt.
- One-time `/auth/bootstrap` with `SALECENTAR_BOOTSTRAP_SECRET` (32+ chars), serialized by DB lock.
- `/auth/login` with 8-hour hashed bearer sessions, `/auth/logout` revocation.
- Roles `admin` and `viewer`; GET admin reports accessible to viewers, POST admin actions only to admins.
- `/admin/users` creates staff accounts (admin only).
- `/control` signs in with email and password; access token only in browser memory.
- In-memory IP login throttling (8 failed attempts / 15 min); deploy a distributed limiter at gateway for multi-instance use.
- Legacy static admin token is disabled unless `SALECENTAR_ALLOW_LEGACY_ADMIN=true` (migration/testing only).

## Setup
Configure `SALECENTAR_DATABASE_URL`, two distinct source secrets and `SALECENTAR_BOOTSTRAP_SECRET`.
POST `/auth/bootstrap` JSON `{"email":"...","password":"14+ characters","bootstrap_secret":"..."}` exactly once.
POST `/auth/login` JSON `{"email":"...","password":"..."}` and use returned token for admin routes.
Do not put any of these secrets in GitHub or client bundles.

## Unfinished / production gates
- Menu Snap still uses its own app_sessions; ZeroBudget AI uses its own pilot owner token.
  Central SSO across all three apps has NOT been implemented.
- PostgreSQL end-to-end integration was not run in this environment.
- External identity provider/OIDC, MFA, distributed rate limits, secure HTTPS reverse proxy,
  backups, monitoring, and verified payment-provider webhooks are not implemented.
- New `sc_users` schema is created at server startup; adopt versioned migrations before production.
- No deployment or GitHub push was performed.
