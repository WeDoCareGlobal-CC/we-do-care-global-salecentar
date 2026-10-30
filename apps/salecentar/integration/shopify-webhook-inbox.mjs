import { createHmac, timingSafeEqual } from 'node:crypto';
import { SHOP_DOMAIN } from './shopify-billing.mjs';

const TOPICS = new Set([
  'orders/paid', 'orders/cancelled', 'refunds/create',
  'subscription_contracts/create', 'subscription_contracts/update'
]);
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export function inspectShopifyWebhook(headers, rawBody, secret) {
  const shop = String(headers['x-shopify-shop-domain'] || '').toLowerCase();
  const topic = String(headers['x-shopify-topic'] || '').toLowerCase();
  const deliveryId = String(headers['x-shopify-webhook-id'] || '');
  const signature = headers['x-shopify-hmac-sha256'];
  if (shop !== SHOP_DOMAIN) throw Object.assign(new Error('Shop not authorized'), { status: 403 });
  if (!TOPICS.has(topic)) throw Object.assign(new Error('Topic not supported'), { status: 400 });
  if (!UUID.test(deliveryId)) throw Object.assign(new Error('Invalid delivery ID'), { status: 400 });
  if (!Buffer.isBuffer(rawBody) || !secret || typeof signature !== 'string') {
    throw Object.assign(new Error('Missing signature'), { status: 401 });
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const actual = /^[A-Za-z0-9+/]{43}=$/.test(signature) ? Buffer.from(signature, 'base64') : Buffer.alloc(0);
  if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) {
    throw Object.assign(new Error('Invalid signature'), { status: 401 });
  }
  // Never log full payloads: these may contain personal data.
  let payload;
  try { payload = JSON.parse(rawBody.toString('utf8')); }
  catch { throw Object.assign(new Error('Malformed JSON'), { status: 400 }); }
  return { shop, topic, deliveryId, payload };
}

export const SHOPIFY_INBOX_DDL = String.raw`
CREATE TABLE IF NOT EXISTS sc_shopify_webhook_inbox (
  shop TEXT NOT NULL,
  delivery_id UUID NOT NULL,
  topic TEXT NOT NULL,
  resource_id TEXT,
  payload_sha256 TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending','verified','rejected','processed')),
  PRIMARY KEY (shop, delivery_id),
  CHECK (shop = 'k0702i-dq.myshopify.com')
);
`;

// This is an inbox, not a paid-order grant. Downstream jobs MUST reconcile
// payment and subscription status with Shopify Admin API, resolve customer
// identity, and apply entitlement transitions transactionally.
export async function recordShopifyWebhook(pool, headers, rawBody, secret) {
  const event = inspectShopifyWebhook(headers, rawBody, secret);
  const resource = event.payload && (event.payload.id ?? event.payload.admin_graphql_api_id);
  const resourceId = resource == null ? null : String(resource).slice(0, 160);
  const digest = createHmac('sha256', 'salecentar-inbox-digest-v1').update(rawBody).digest('hex');
  const result = await pool.query(
    `INSERT INTO sc_shopify_webhook_inbox
       (shop,delivery_id,topic,resource_id,payload_sha256)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (shop,delivery_id) DO NOTHING
     RETURNING delivery_id`,
    [event.shop, event.deliveryId, event.topic, resourceId, digest]
  );
  return { accepted: true, duplicate: result.rowCount === 0, grantsCreated: 0 };
}
