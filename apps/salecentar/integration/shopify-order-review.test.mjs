import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewShopifyOrder, orderIdFromPaidWebhook } from './shopify-order-review.mjs';

const id='gid://shopify/Order/456';
const variant='gid://shopify/ProductVariant/777';
const paid={id,cancelledAt:null,displayFinancialStatus:'PAID',
 customer:{id:'gid://shopify/Customer/99'},
 lineItems:{nodes:[{quantity:2,variant:{id:variant}}],pageInfo:{hasNextPage:false}}
};
function fakeFetch(order) {
 return async()=>({ok:true,json:async()=>({data:{order}})});
}
test('paid order review is recorded, but grants nothing',async()=>{
 const writes=[];
 const pool={query:async(sql,args)=>{writes.push(args);return {rowCount:1};}};
 const x=await reviewShopifyOrder({orderId:id,accessToken:'mock-admin-token-length-123456',
  approvedVariants:new Set([variant]),fetchImpl:fakeFetch(paid),pool});
 assert.equal(x.verified,true);
 assert.equal(x.grantsCreated,0);
 assert.equal(writes.length,1);
 assert.equal(writes[0][0],'k0702i-dq.myshopify.com');
 assert.deepEqual(JSON.parse(writes[0][5]),[{variantId:variant,quantity:2}]);
});
test('cancelled order writes revoked review state',async()=>{
 const writes=[];
 const pool={query:async(_sql,args)=>{writes.push(args);return {rowCount:1};}};
 const x=await reviewShopifyOrder({orderId:id,accessToken:'mock-admin-token-length-123456',
  approvedVariants:new Set([variant]),fetchImpl:fakeFetch({...paid,cancelledAt:'2026-10-30T00:00:00Z'}),pool});
 assert.equal(x.verified,false);
 assert.equal(writes[0][3],false);
 assert.deepEqual(JSON.parse(writes[0][5]),[]);
 assert.equal(writes[0][2],null);
});
test('network or Shopify API error prevents database writes',async()=>{
 let writes=0;
 await assert.rejects(reviewShopifyOrder({orderId:id,accessToken:'mock-admin-token-length-123456',
   approvedVariants:new Set([variant]),fetchImpl:async()=>({ok:false}),pool:{query:async()=>{writes++;}}}),/unavailable/);
 assert.equal(writes,0);
});
test('only orders/paid on new store may enqueue paid-order review',()=>{
 assert.equal(orderIdFromPaidWebhook({shop:'k0702i-dq.myshopify.com',
  topic:'orders/paid',payload:{id:456}}),id);
 assert.equal(orderIdFromPaidWebhook({shop:'s91wj7-dq.myshopify.com',
  topic:'orders/paid',payload:{id:456}}),null);
 assert.equal(orderIdFromPaidWebhook({shop:'k0702i-dq.myshopify.com',
  topic:'refunds/create',payload:{id:456}}),null);
});
