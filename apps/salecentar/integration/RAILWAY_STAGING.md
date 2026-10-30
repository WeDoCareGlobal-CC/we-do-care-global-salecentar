# SaleCentar isolated Railway staging

Scope: only the new Shopify shop `k0702i-dq.myshopify.com`. Do not connect the original `shop.wedocare-global.com` store or publish products.

## Deploy configuration

- GitHub repository: `WeDoCareGlobal/we-do-care-global-salecentar`.
- Railway service root directory: `apps/salecentar/integration`.
- Builder: Dockerfile (Node.js 22, `npm ci`, `node server.mjs`).
- Config-as-code: `railway.json` at the service root; health endpoint: `/health`.
- Railway sets `PORT`, the service listens on `0.0.0.0` when `RAILWAY_ENVIRONMENT` is present.
- Create a dedicated **staging-only** PostgreSQL service in the same Railway project, and bind its internal connection URL as `SALECENTAR_DATABASE_URL` (secret). No production database reuse.

## Required secrets (set in Railway, never commit)

- `SALECENTAR_DATABASE_URL`: dedicated staging PostgreSQL URL.
- `SALECENTAR_MENU_SNAP_SECRET`, `SALECENTAR_ZERO_BUDGET_SECRET`: different random strings, each at least 32 characters.
- If Muse-Flow, Speech Generator or Hermes internal APIs are enabled, configure their corresponding distinct service secrets, also at least 32 characters.
- `SALECENTAR_ADMIN_TOKEN`: a distinct random 32+ character secret when administrative bootstrap is required.
- `SALECENTAR_ALLOW_LEGACY_ADMIN=false`.
- Set `SALECENTAR_SHOPIFY_WEBHOOK_SECRET` **only** after registering a webhook on `k0702i-dq.myshopify.com` and confirming the app's required event delivery/reconciliation flow. Never put a Shopify Admin token or webhook secret in source or logs.

## Release gate

1. Review and merge the staging-only PR after green CI.
2. Provision Railway PostgreSQL and the staging Node service.
3. Bind secrets in Railway's protected configuration; ensure no original-store credentials or domain are present.
4. Confirm Railway's deployment is healthy and `GET /health` returns 200 over HTTPS.
5. Verify that unauthorized webhook calls and original-store events are rejected.
6. Verify Admin API reconciliation, authenticated identity linking, and a complete staging checkout/fulfillment flow before activating any draft products.
7. Keep all nine Shopify products **DRAFT** with placeholder prices and leave checkout/billing disabled until a separate release approval.

This configuration does not itself publish a Shopify storefront, install a Shopify app, provision a database, or implement automatic license delivery.
