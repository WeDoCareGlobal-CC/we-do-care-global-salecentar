import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateShopifyOrder, reconcileShopifyOrder } from './shopify-order-reconcile.mjs';

const id='gid://shopify/Order/123';
const variant='gid://shopify/ProductVariant/55';
const approved = new Set([variant]);
const paid = {
  id, cancelledAt:null, displayFinancialStatus:'PAID',
  customer:{id:'gid://shopify/Customer/88'},
  lineItems:{nodes:[{quantity:1,variant:{id:variant}}],pageInfo:{hasNextPage:false}}
};
test('verified paid order with allowlisted variant is a candidate, not an entitlement',()=>{
  assert.deepEqual(evaluateShopifyOrder(paid,id,approved),{
    verified:true,orderId:id,customerId:paid.customer.id,
    lines:[{variantId:variant,quantity:1}]
  });
});
test('financial or cancellation changes block verification',()=>{
  for(const status of ['PENDING','AUTHORIZED','PARTIALLY_PAID','PARTIALLY_REFUNDED','REFUNDED','VOIDED']){
    assert.equal(evaluateShopifyOrder({...paid,displayFinancialStatus:status},id,approved).verified,false);
  }
  assert.equal(evaluateShopifyOrder({...paid,cancelledAt:'2026-10-30T00:00:00Z'},id,approved).verified,false);
});
test('wrong order, unknown variant, missing customer and truncation are denied',()=>{
  assert.equal(evaluateShopifyOrder(paid,'gid://shopify/Order/999',approved).verified,false);
  assert.equal(evaluateShopifyOrder(paid,id,new Set(['gid://shopify/ProductVariant/999'])).verified,false);
  assert.equal(evaluateShopifyOrder({...paid,customer:null},id,approved).verified,false);
  assert.equal(evaluateShopifyOrder({...paid,lineItems:{...paid.lineItems,pageInfo:{hasNextPage:true}}},id,approved).verified,false);
});
test('Admin query uses isolated shop and does not trust webhook payment claims',async()=>{
  let calls=0;
  const fetchImpl=async(url,init)=>{
    calls++;
    assert.equal(new URL(url).hostname,'k0702i-dq.myshopify.com');
    assert.equal(init.method,'POST');
    assert.equal(JSON.parse(init.body).variables.id,id);
    return {ok:true,json:async()=>({data:{order:paid}})};
  };
  const result=await reconcileShopifyOrder({orderId:id,accessToken:'test-token-valid-for-mock-only',approvedVariants:approved,fetchImpl});
  assert.equal(result.verified,true);
  assert.equal(calls,1);
  await assert.rejects(reconcileShopifyOrder({
    orderId:id,accessToken:'test-token-valid-for-mock-only',approvedVariants:approved,
    shopDomain:'s91wj7-dq.myshopify.com',fetchImpl
  }),/Incorrect Shopify shop/);
  assert.equal(calls,1);
});
test('network failures fail closed',async()=>{
  await assert.rejects(reconcileShopifyOrder({
    orderId:id,accessToken:'test-token-valid-for-mock-only',approvedVariants:approved,
    fetchImpl:async()=>({ok:false,status:429})
  }),/unavailable/);
  await assert.rejects(reconcileShopifyOrder({
    orderId:id,accessToken:'test-token-valid-for-mock-only',approvedVariants:approved,
    fetchImpl:async()=>({ok:true,json:async()=>({errors:[{message:'denied'}]})})
  }),/failed/);
});
