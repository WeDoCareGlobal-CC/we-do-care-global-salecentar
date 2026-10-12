# We Do Care Global SaleCentar — shared login (v5)

## Implemented
- SaleCentar remains the **identity authority** for staff: `sc_users` and `sc_sessions`.
- Internal `POST /internal/auth/introspect` validates active central sessions. It requires a module-specific secret and rejects unknown callers.
- Menu Snap `/api/auth/login` delegates credentials to SaleCentar when `SALECENTAR_AUTH_URL` is set. Protected Menu Snap routes validate the central session, mapping central identity to a local `app_users` record for existing menu/AI quota foreign keys.
- ZeroBudget AI `/api/auth/login` delegates credentials to SaleCentar. Its UI has a login form; the resulting session stays in browser memory and is used by the generator and pilot intake. Pilot orders require the central `admin` role.
- When central auth is configured, ZeroBudget AI rejects the old owner token and Menu Snap rejects its old local session tokens.
- The original Menu Snap bootstrap endpoint is disabled when central auth is configured.

## Configuration
Configure the integration service with `SALECENTAR_DATABASE_URL`, `SALECENTAR_BOOTSTRAP_SECRET`, and **distinct** `SALECENTAR_MENU_SNAP_SECRET` and `SALECENTAR_ZERO_BUDGET_SECRET`.
On both module servers set `SALECENTAR_AUTH_URL` to the integration service's **private/internal** origin, and set the matching module secret to the exact value on the central service. Start the central service before the modules.
The existing SaleCentar `/auth/bootstrap` and `/auth/login` create and authenticate staff.
Never put module secrets in frontend environment variables. Use HTTPS/mTLS or private loopback/network between services, not plain HTTP over the public internet.

## Limitations and remaining gates
- This is **centralized staff login/session verification**, not standards-based OIDC/OAuth SSO or customer account federation.
- The central service still uses a PostgreSQL schema initialized at runtime, not versioned migrations.
- ZeroBudget AI quota is still in-memory (per-user when central auth is enabled); replace with durable, atomic quotas.
- Central service calls depend on the availability of SaleCentar. A failure must deny access.
- ZeroBudget AI and Menu Snap forward logout to the central `/auth/logout` route; if the upstream is unreachable, local browser state is cleared but server-side revocation cannot be guaranteed.
- Existing Menu Snap users are mapped by matching email; review/migrate pre-existing local accounts and ownership before deploying with real users.
- Do not expose the introspection endpoint publicly; add gateway IP restrictions, service identity, distributed rate limiting, and audit logging.
- The login proxy may cause upstream IP-based throttling to group multiple users under the same module server IP; replace with a properly designed gateway rate limiter.
- PostgreSQL end-to-end tests, full app builds, and production deployment remain unverified in this environment.
