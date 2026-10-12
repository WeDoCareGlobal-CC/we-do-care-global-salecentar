# Phase B — implementation delivery (source-only)

## Implemented in this ZIP
- PostgreSQL schema auto-created on startup: users, hashed server sessions, tenant-scoped menus, persistent daily AI quota, usage events, image metadata, pilot orders.
- Multi-user email/password login (scrypt hashed), admin-only user provisioning, 12-hour opaque bearer sessions; browser token stays in memory.
- AI routes require session and transactional per-user/day quota. All attempts count toward quota.
- Menu CRUD, approval and approved JSON export with ownership checks.
- Image uploads stored outside public web root and served only after authenticated ownership checks.
- React login, save menu, upload generated images, load last saved menu, approve and export.
- Manual pilot order ledger with server-configured EUR price; admin marks paid only after independently verifying an external payment reference. No card processor, webhook, or automated payment verification.
- Admin-only SaleCentar JSON export (contract proposal, not a live SaleCentar integration).
- Node built-in static source regression tests; no dependency installation required to run them.

## Initial setup
1. Use Node 22+, PostgreSQL 15+; create an empty database and a least-privilege application role.
2. Set DATABASE_URL, a 32+ character ADMIN_BOOTSTRAP_KEY, GEMINI_API_KEY, and MENU_SNAP_PRICE_CENTS in server environment. For hosted Postgres configure verified TLS; PG_SSL=true enables TLS with CA validation.
3. Install dependencies with `npm install` (updates lockfile), run `npm run lint`, `npm test`, `npm run build`, then `npm start`. **These dependency-dependent commands were not successfully verified in the delivery environment.**
4. Bootstrap first admin exactly once:
   `curl -X POST http://localhost:3000/api/auth/bootstrap -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"REPLACE_WITH_STRONG_PASSWORD","bootstrapKey":"YOUR_SERVER_BOOTSTRAP_KEY"}'`
5. Log in via browser. Admin can provision customers via POST `/api/admin/users` with JSON email/password and Bearer admin token. Never share admin credentials with customers.
6. For manual pilot orders: authenticated customer POST `/api/orders` with `{ "menuId": "UUID", "offerCode": "MENU_SNAP_STARTER" }`. Independently confirm actual payment off-platform, then admin POST `/api/admin/orders/:id/verify` with `{ "externalReference": "REAL_BANK_OR_PROVIDER_RECEIPT" }`. Do not call verify for demo payments.
7. Admin GET `/api/admin/salecentar-export` downloads JSON. SaleCentar import must be independently developed and validated.

## Deployment blockers / limitations
- Not a verified production release. No installed dependency integration test, browser E2E, load test, fresh CVE scan, or verified deployment.
- No live payment gateway, signed webhook, automatic entitlement or fulfillment. Admin verification is a manual trust boundary.
- Local image filesystem is suitable for a single persistent server only; use private object storage and backups for multi-instance production.
- Login has only single-process IP throttling and lacks production-grade distributed/account throttling, email verification, MFA, password recovery, CSRF-safe cookie sessions, session revocation UI and admin audit trail.
- Database migration currently uses idempotent CREATE TABLE on startup; adopt versioned migrations for production.
- No object-storage quotas, upload malware scanning, image dimension/EXIF sanitization, robust content moderation or backup/restore tests.
- AI model IDs and image endpoints were not verified against provider account.
- Restaurant must approve prices, ingredients, allergens, images and claims; AI suggestions are not factual verification.
- Existing sample menus are DEMOS; do not advertise as actual restaurant data.
- Usage counts attempted AI calls, not real provider token cost.
- Frontend saves last menu and image data, but a full menu selection/library and billing interface remain unbuilt.
- Existing lockfile was not regenerated because package install was not available; resolve dependencies and commit a new lockfile before release.
- SaleCentar has not been accessed or modified.
