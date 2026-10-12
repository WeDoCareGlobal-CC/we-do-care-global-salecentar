# Menu Snap -> SaleCentar: verified pilot order sync

## Scope
A real server-to-server signed sync and durable PostgreSQL order mirror. This is NOT automatic payment processing or a live integration into the existing AppDeploy dashboard UI. Only an authenticated Menu Snap admin can trigger synchronization.

## Configure
1. Provision a dedicated PostgreSQL database for SaleCentar. Keep its credentials private.
2. In `apps/salecentar/integration`, run `npm install` and `npm start` with values from `.env.example` set as environment variables. The receiver binds to localhost by default.
3. Set `SALECENTAR_SYNC_URL` and the identical `SALECENTAR_SYNC_SECRET` in Menu Snap server environment. Never put these values in Vite/browser env variables.
4. From an authenticated Menu Snap admin session, `POST /api/admin/salecentar-sync` with the Bearer session token. The receiver checks the HMAC signature, validates each order, and upserts by `(source, source_order_id)`.
5. An administrator can query `GET /admin/orders` on the receiver with `Authorization: Bearer <SALECENTAR_ADMIN_TOKEN>`. This is a backend endpoint; the existing SaleCentar UI is NOT wired to it.

## Important constraints
- Status `paid` originates ONLY from Menu Snap's manual administrator payment verification; this is not payment-provider verification.
- Existing SaleCentar demo products and its AppDeploy dashboard are not replaced. The integration service is separate; merging its read-only API into the UI requires the AppDeploy deployment environment.
- The sync sends buyer emails; configure HTTPS between hosts, least-privilege access, data retention and backups before using real customer information.
- The receiver binds to 127.0.0.1; for separate hosts put it behind a secured HTTPS reverse proxy, not a public unauthenticated port.
- Sync is administrator-triggered, not scheduled. Repeated syncs update status without duplicate rows.
- Full database/integration tests and deployment remain unverified.

## Test
`cd apps/salecentar/integration && npm test` runs isolated validation/HMAC tests without database or external services.
