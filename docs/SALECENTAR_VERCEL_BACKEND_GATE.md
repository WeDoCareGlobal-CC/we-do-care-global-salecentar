# SaleCentar Vercel backend readiness gate (staging only)

## Verified baseline

- `main` currently deploys one Vercel Services **Vite static preview** (`salecentar-preview`) with a read-only landing page. It does not host an authenticated API.
- The legacy integration service `apps/salecentar/integration/server.mjs` calls `http.createServer` and `server.listen`, and executes multiple PostgreSQL DDL statements at module startup.
- `apps/salecentar/src/lib/central-api.ts` expects same-origin `/api/v2/*` routes using HttpOnly session cookies and CSRF enforcement. No public rewrite currently targets a backend service.
- The staging preview is published in Vercel's **Production** deployment environment, but it is **not** a live SaleCentar commerce release. Do not infer active payments or entitlements.
- GitHub CI already runs isolated PostgreSQL integration tests for Shopify grant/revoke semantics. These tests do **not** verify production Shopify webhook delivery or credentials.

## Required migration before enabling any public API route

1. Split the existing HTTP request handler from process startup: export a request-driven handler suitable for Vercel Functions. Never open a listener during function import.
2. Extract DDL into a versioned migration command executed explicitly against a **separate staging Postgres** database. Do not run migrations on every cold start or request.
3. Use bounded serverless-safe PostgreSQL pooling and a protected database connection. Keep database credentials out of Git, browser bundles, logs, and GitHub PR comments.
4. Add explicit routing only for audited endpoints. Keep `/admin/*`, `/internal/*`, and payment verification inaccessible until their authentication and authorization are independently tested.
5. On any Shopify integration, accept only new-store credentials for `k0702i-dq.myshopify.com` and verify webhook HMAC, shop domain, deduplication and trusted order reconciliation server-side. Never use or modify `shop.wedocare-global.com` or the original `s91wj7-dq` shop.
6. Add request-level tests for same-origin cookies, CSRF, unauthenticated callers, 404 fail-closed behavior and denial of original-shop payloads. Add a real staging e2e test with a disposable order before activating entitlement delivery.
7. Only after all gates pass, add an **internal** backend Vercel service with an explicit caller binding and minimal public rewrites. Binding provides connectivity, not authentication.
8. Require a separate approved release for Shopify product publication, checkout or paid billing; current nine drafts must remain drafts.

## Explicit service graph

Current Vercel service: `salecentar-preview`, public `/(.*)`, statically built Vite v2, no bindings.

Proposed future service: `salecentar-api`, initially internal only. No binding or public rewrite should be added before the implementation and security tests exist. There is no deployed database or live backend as part of this change.

This document and its CI release gate intentionally do **not** change runtime deployment configuration.
