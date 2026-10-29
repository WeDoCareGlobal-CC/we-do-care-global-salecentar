# SaleCentar Shopify commercial readiness (review proposal)

**Authorized Shopify shop:** `k0702i-dq.myshopify.com` only. Do not touch `shop.wedocare-global.com`.
**Shopify plan:** Advanced. **Shop currency:** BAM. **Public launch:** blocked until verification gates pass.

## Proposed offers (prices are hypotheses, not published)
| SKU | Offer | Billing | Proposed BAM | Included usage |
| --- | --- | --- | ---: | --- |
| MENU_SNAP_M | Menu Snap | Monthly | 39 | 1 restaurant, menu editor and export; limited to verified functioning features |
| MENU_SNAP_Y | Menu Snap | Annual | 390 | Same as monthly; annual discount |
| SPEECH_50 | Speech Generator | One-time | 19 | 50 requests, max 3,000 characters per request; validate provider costs first |
| SALECENTAR_SETUP | SaleCentar Implementation | One-time | 599 | Discovery and scoped implementation; human-delivered, not an instant software license |

No credit expiry, refund promises, or auto-renewal may be advertised until policy and local legal compliance have been reviewed. Monthly/yearly plans renew on their corresponding anniversary where supported by the subscription provider. Display clear cancellation terms. Proposed policy: allow cancellation effective at term end, halt renewals promptly, and handle refund requests case-by-case under applicable consumer law. Do not promise no refunds or deny statutory rights.

## Production implementation gates
1. Register webhook with signing secret held in secret manager, TLS-only ingress, strict raw-body HMAC validation and shop allowlist.
2. Apply separate persisted idempotency keys for webhook deliveries and Shopify order IDs. Never grant from a webhook body alone; verify payment state and subscription contract through authenticated Shopify Admin API.
3. Maintain authoritative offer-to-variant mapping, customer linkage, entitlement expiry, usage ledger, and access revocation. Avoid customer email as sole identity key.
4. Reject unpaid, cancelled, refunded, disputed, expired, and unknown price-plan states. Handle out-of-order delivery, retries, partial refunds, chargebacks, renewals, and failed payments.
5. Enforce entitlements inside *each* module before selling. Current pilot enforces only Speech Generator. Keep the others as non-purchasable drafts.
6. Configure Shopify subscription app/provider and verify recurring contract events end-to-end. Shopify Advanced alone does not provision subscriptions.
7. Verify test checkout, taxes, digital fulfillment, cancellation, chargeback, refunds, customer support, privacy, and failure recovery with provider sandbox where available.
8. Profitability: contribution = collected net sales - processor/platform fees - taxes borne by merchant - AI inference - hosting - labor/support - refunds - acquisition. Measure per offer and per cohort; do not infer profit from list price.
9. Keep storefront private until operational and compliance approval. Do not change DNS, domains, or original Shopify store.

`shopify-billing.mjs` contains isolated validators and fail-closed access logic, **not a complete webhook server or live billing integration**. It must not be advertised as payment-enabled.
