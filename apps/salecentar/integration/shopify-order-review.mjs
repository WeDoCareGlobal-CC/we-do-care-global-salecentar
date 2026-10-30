import { SHOP_DOMAIN } from './shopify-billing.mjs';
import { reconcileShopifyOrder } from './shopify-order-reconcile.mjs';

// Shopify webhook deliveries are a signal to re-fetch current authoritative state.
// This function NEVER creates customer identities, subscription contracts or entitlements.
export const SHOPIFY_REVIEWS_DDL = `
CREATE TABLE IF NOT EXISTS sc_shopify_order_reviews (
  shop TEXT NOT NULL CHECK (shop = 'k0702i-dq.myshopify.com'),
  order_id TEXT NOT NULL CHECK (order_id ~ '^gid://shopify/Order/[1-9][0-9]*$'),
  customer_id TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  reason TEXT NOT NULL,
  eligible_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shop,order_id)
);
`;

// No purchase data from Shopify webhooks is treated as authoritative here.
export async function reviewShopifyOrder({
  orderId, pool, accessToken, approvedVariants, fetchImpl
}) {
  if (!pool || typeof pool.query !== 'function') throw Error('PostgreSQL pool required');
  // Capture before network I/O: late responses must not overwrite newer reviews.
  const checkStartedAt = new Date();
  const order = await reconcileShopifyOrder({ orderId, accessToken, approvedVariants, fetchImpl });
  const lines = order.verified ? order.lines : [];
  const customerId = order.verified ? order.customerId : null;
  const reason = order.verified ? 'fully_paid_eligible_order' : order.reason;
  await pool.query(`
    INSERT INTO sc_shopify_order_reviews
      (shop,order_id,customer_id,verified,reason,eligible_lines,checked_at)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::timestamptz)
    ON CONFLICT (shop,order_id)
    DO UPDATE SET customer_id=EXCLUDED.customer_id,
      verified=EXCLUDED.verified,
      reason=EXCLUDED.reason,
      eligible_lines=EXCLUDED.eligible_lines,
      checked_at=EXCLUDED.checked_at
    WHERE sc_shopify_order_reviews.checked_at <= EXCLUDED.checked_at
  `,[SHOP_DOMAIN,orderId,customerId,order.verified,reason,JSON.stringify(lines),checkStartedAt.toISOString()]);
  return { orderId, verified:order.verified, reason, grantsCreated:0 };
}

// Prevent mistaken fulfillment of a cancellation/refund webhook before the
// current Shopify order and any refund-adjusted entitlement are reconciled.
export function orderIdFromPaidWebhook(event) {
  if (event?.shop !== SHOP_DOMAIN || event?.topic !== 'orders/paid') return null;
  const id = event.payload?.id;
  if (!Number.isSafeInteger(id) || id<=0) return null;
  return `gid://shopify/Order/${id}`;
}
