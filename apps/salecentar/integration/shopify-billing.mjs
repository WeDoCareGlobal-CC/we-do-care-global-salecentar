import { createHmac, timingSafeEqual } from 'node:crypto';

// Only the dedicated SaleCentar Shopify shop is authorized for this integration.
export const SHOP_DOMAIN = 'k0702i-dq.myshopify.com';
export const TOPICS = new Set(['orders/paid', 'orders/cancelled', 'refunds/create', 'subscription_contracts/create', 'subscription_contracts/update']);

export function verifyWebhook(rawBody, base64Signature, secret) {
  if (!Buffer.isBuffer(rawBody) || !secret || typeof base64Signature !== 'string' ||
      !/^[A-Za-z0-9+/]{43}=$/.test(base64Signature)) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const actual = Buffer.from(base64Signature, 'base64');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validateHeaders(headers) {
  const shop = String(headers['x-shopify-shop-domain'] || '').toLowerCase();
  const topic = String(headers['x-shopify-topic'] || '').toLowerCase();
  const id = String(headers['x-shopify-webhook-id'] || '');
  if (shop !== SHOP_DOMAIN) throw Error('Unexpected Shopify shop');
  if (!TOPICS.has(topic)) throw Error('Unsupported Shopify topic');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw Error('Invalid webhook ID');
  return { shop, topic, id };
}

export function validatedPaidOrder(order) {
  if (!order || !Number.isSafeInteger(order.id) || order.financial_status !== 'paid' ||
      order.cancelled_at != null || !Number.isSafeInteger(order.customer?.id) ||
      !Array.isArray(order.line_items) || !order.line_items.length) {
    throw Error('Not a verified paid order payload');
  }
  return { orderId: String(order.id), customerId: String(order.customer.id) };
}

// Never grant access merely because a webhook was received. The webhook handler must
// additionally perform a trusted Shopify Admin API reconciliation and idempotent DB write.
export function accessAllowed({ paid, status, activeUntil, moduleEnforcesAccess, now = Date.now() }) {
  return paid === true && moduleEnforcesAccess === true &&
    ['ACTIVE', 'TRIALING'].includes(status) &&
    typeof activeUntil === 'string' && Number.isFinite(Date.parse(activeUntil)) &&
    Date.parse(activeUntil) > now;
}
