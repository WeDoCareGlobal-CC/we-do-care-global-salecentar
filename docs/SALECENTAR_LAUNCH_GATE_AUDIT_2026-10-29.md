# SaleCentar launch gate audit — 2026-10-29

Shopify shop: `k0702i-dq.myshopify.com` (Advanced, BAM).
Protected store: `shop.wedocare-global.com` — NEVER MODIFY.

## Confirmed Shopify changes (2026-10-29)
- Six auto-generated active Shopify sample products archived.
- Six real candidate products created as DRAFT: SalesPuls, Muse-Flow, Interior AI, Portfolio AI, ZeroBudget AI, AI Music Studio.
- Six new draft products added to the existing SaleCentar collection, now 9 development-stage products total.
- Shopify Digital Products connector reachable, but file delivery and entitlements not tested.
- All draft prices are 0.00 BAM placeholders, not approved live prices.

## Gate policy

No product may be ACTIVE until all release gates below have pass evidence:
1. App build/test green for the exact deployed commit; runtime smoke test on production-like hosting.
2. Authn/authz on every paid endpoint; identity tied to a Shopify customer through a verified provisioning step.
3. Shopify billing state checked using authenticated Admin API; raw-body HMAC verified, timestamp/replay window, strict new-store allowlist, durable idempotency and safe retries; refunded/disputed/cancelled payments revoke or adjust access.
4. Subscription app configuration and recurring renewal, payment-failure, grace period, cancellation, termination tests (if recurring).
5. Usage metering enforced on backend with atomic consumption; throttling and per-tenant caps; AI provider quotas and expected cost recorded.
6. Data retention, privacy, consent for audio/photo/document uploads, merchant tax and refund rules reviewed by responsible human.
7. Digital delivery and buyer support path validated with test order; webhook error alerts and manual reconciliation available.
8. Profit contribution calculated per product after gateway, AI, hosting, refunds, support, tax and acquisition costs; no unlimited AI plan before caps.
9. No credentials in repository, least-privilege access, safe domain configuration and SSL.
10. Independent explicit merchant final go-live approval **after** checks pass.

## Inventory and release priority

| Candidate | Readiness from inspected code | Sell now? | Key blocker |
| --- | --- | --- | --- |
| Menu Snap | Pilot/staging | No | Verified provisioning + subscription contract |
| Speech Generator | Pilot | No | Provider quotas, usage ledger, downloadable/hosted delivery |
| SaleCentar Platform | Integration pilot | No | Production backend + services and access |
| SalesPuls | Express/Gemini analyze endpoint | No | Authentication, audio consent/retention, billing and metering |
| Muse-Flow | Express/Gemini writing endpoints | No | Authentication, rate limits, tested delivery; production build |
| Interior AI | Express/Gemini image endpoints | No | Privacy, file-size safety, pricing, image generation verification |
| Portfolio AI | Express/Gemini + PDF client code | No | Auth, PDF delivery, Gemini spend limits |
| ZeroBudget AI | Express/Gemini generator endpoint | No | Auth, paid access + provider quotas |
| AI Music Studio | In-memory job/projects API | No | Persistent storage, actual audio engine verification, licensing |

## Engineering sequencing

**Milestone A (next):** Reconcile `apps/salecentar/integration` with reviewed security predicate. Implement real endpoint with Shopify signed webhook raw body, subscription renewal/cancel/revoke and authenticated Admin payment reconciliation. Add transactional Postgres schema for webhook events, order lines, customer identity, entitlements and credit ledger.

**Milestone B:** Enforce entitlements in Muse-Flow and SalesPuls API; secure secrets; add upload validation and cost counters; run isolated integration tests.

**Milestone C:** Configure merchant Shopify payments/subscription provider, legal tax/cancellation/consumer policies, customer communications, and test transactions. Attach actual products to digital delivery only after valid deliverables exist.

**Milestone D:** Full paid-flow rehearsal; document test IDs/logs; activate only verified items, and only after passed gates.

No production checkout, deployment, or transaction test has been performed by this audit. No app ready for public release was verified.
