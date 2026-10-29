import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { inspectShopifyWebhook, recordShopifyWebhook } from './shopify-webhook-inbox.mjs';

const secret='test-webhook-secret';
const body=Buffer.from(JSON.stringify({id:123,financial_status:'paid'}));
const baseHeaders={
  'x-shopify-shop-domain':'k0702i-dq.myshopify.com',
  'x-shopify-topic':'orders/paid',
  'x-shopify-webhook-id':randomUUID(),
  'x-shopify-hmac-sha256':createHmac('sha256',secret).update(body).digest('base64')
};
test('valid event can be inspected',()=> {
  assert.equal(inspectShopifyWebhook(baseHeaders,body,secret).payload.id,123);
});
test('reject altered payload',()=> {
  assert.throws(()=>inspectShopifyWebhook(baseHeaders,Buffer.from('{}'),secret),/signature/);
});
test('reject original protected store',()=> {
  assert.throws(()=>inspectShopifyWebhook({...baseHeaders,'x-shopify-shop-domain':'s91wj7-dq.myshopify.com'},body,secret),/authorized/);
});
test('reject unexpected topic',()=> {
  assert.throws(()=>inspectShopifyWebhook({...baseHeaders,'x-shopify-topic':'customers/delete'},body,secret),/Topic/);
});
test('replayed webhook is idempotent, with no grants',async()=> {
  let count=0;
  const db={query:async()=>({rowCount:count++===0?1:0})};
  const first=await recordShopifyWebhook(db,baseHeaders,body,secret);
  const second=await recordShopifyWebhook(db,baseHeaders,body,secret);
  assert.equal(first.duplicate,false);
  assert.equal(second.duplicate,true);
  assert.equal(first.grantsCreated,0);
  assert.equal(second.grantsCreated,0);
});
