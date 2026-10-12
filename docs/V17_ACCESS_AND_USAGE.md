# v17 — Access and speech usage (pilot)

Implemented from v16:

- `sc_module_entitlements`: per-user, per-module access grants, default deny for speech.
- `POST /admin/entitlements`: admin-only grant/revoke by `user_id`, `module_id`, `enabled`. No payment or purchase automatically grants access.
- `sc_speech_usage`: durable PostgreSQL request accounting, one UUID per request, `reserved`, `succeeded`, `failed`.
- `POST /internal/speech/usage/reserve`: Speech Generator service-key authorization plus *fresh central user token* verification, entitlement check (admin bypass), transaction-scoped advisory lock per user, UTC daily limit, atomic reservation.
- `POST /internal/speech/usage/finish`: service-key protected completion, only reserved records can be finalized.
- `/portal/api/modules`: grant status for all five catalog modules.
- `/portal/api/usage`: authenticated user's own speech usage for the last 30 days (UTC).
- Speech Generator calls central reservation before provider call and completion afterward; provider failures are counted as attempts to control cost.
- New mocked speech tests and `speech.db.integration.test.mjs` with actual PostgreSQL, session, grant, quota, portal and idempotency assertions.

## Critical limitations

- Central grant **is enforced by Speech Generator only**. Other four modules still require module-specific authorization integration before access controls are effective there. Portal flags for those modules are informational.
- The database is the source of truth for speech usage, but if completion fails after provider success, the reservation remains `reserved` and the API returns 503. Reconciliation of abandoned reservations is needed before production.
- Speech provider live generation, full frontend builds, and PostgreSQL integration tests require external services and dependencies. Local runs without PostgreSQL skip database tests.
- Module access is manually assigned; it is not linked to verified payments or subscription billing.
- UTC-based daily limit is configured independently on the SaleCentar integration service (`SPEECH_DAILY_LIMIT`, default 20). Do not set a different limit on the Speech Generator and assume it will apply.
- Startup DDL is pilot migration behavior; formal versioned migrations, backups and migration rollback testing are still required.
