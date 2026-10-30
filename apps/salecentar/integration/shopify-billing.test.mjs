import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { SHOP_DOMAIN, verifyWebhook, validateHeaders, validatedPaidOrder, accessAllowed } from './shopify-billing.mjs';

test('HMAC validates raw body and rejects tampering', () => {
  const body = Buffer.from('{"id":1}'), secret = 'unit-test-only';
  const sig = createHmac('sha256', secret).update(body).digest('base64');
  assert.equal(verifyWebhook(body, sig, secret), true);
  assert.equal(verifyWebhook(Buffer.from('{"id":2}'), sig, secret), false);
  assert.equal(verifyWebhook(body, 'bad', secret), false);
});

test('strict shop isolation and topic validation', () => {
  const h = {'x-shopify-shop-domain':SHOP_DOMAIN, 'x-shopify-topic':'orders/paid', 'x-shopify-webhook-id':'12345678-1234-1234-1234-123456789abc'};
  assert.equal(validateHeaders(h).shop, SHOP_DOMAIN);
  assert.throws(() => validateHeaders({...h, 'x-shopify-shop-domain':'s91wj7-dq.myshopify.com'}));
  assert.throws(() => validateHeaders({...h, 'x-shopify-topic':'customers/delete'}));
});

test('unpaid and cancelled orders are rejected', () => {
  const order = {id:123, financial_status:'paid', cancelled_at:null, customer:{id:456},line_items:[{}]};
  assert.equal(validatedPaidOrder(order).customerId, '456');
  assert.throws(() => validatedPaidOrder({...order, financial_status:'pending'}));
  assert.throws(() => validatedPaidOrder({...order, cancelled_at:'2026-01-01'}));
});

test('expired, failed-payment, and unenforced access fails closed', () => {
  const ok = { paid:true, status:'ACTIVE', activeUntil:'2030-01-01T00:00:00Z', moduleEnforcesAccess:true, now:Date.UTC(2026,9,29)};
  assert.equal(accessAllowed(ok), true);
  for (const change of [{paid:false},{status:'PAST_DUE'},{status:'CANCELLED'},{moduleEnforcesAccess:false},{activeUntil:'2025-01-01T00:00:00Z'}]) {
    assert.equal(accessAllowed({...ok,...change}),false);
  }
});
