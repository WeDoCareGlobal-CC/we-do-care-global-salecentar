import test from 'node:test';
import assert from 'node:assert/strict';
import {revokeIneligibleOrder} from './shopify-revoke-tx.mjs';
const orderId='gid://shopify/Order/123',user='ae2c3654-4567-4567-8567-123456789abc';
function db({verified=false,reason='cancelled',other=false}={}){
 const log=[];
 return {log,pool:{connect:async()=>({query:async(q,args)=>{
  log.push({q,args});
  if(q.includes('FROM sc_shopify_order_reviews'))return {rowCount:1,rows:[{verified,reason,checked_at:new Date().toISOString()}]};
  if(q.includes('SELECT DISTINCT user_id,module_id FROM sc_shopify_grants'))return {rowCount:1,rows:[{user_id:user,module_id:'muse-flow'}]};
  if(q.includes('UPDATE sc_shopify_grants'))return {rowCount:1,rows:[{user_id:user,module_id:'muse-flow'}]};
  if(q.includes('SELECT 1 FROM sc_shopify_grants'))return {rowCount:other?1:0,rows:[]};
  return {rowCount:1,rows:[]};
 },release:()=>{}})}};
}
test('unpaid or cancelled verified review revokes access when no other grant',async()=>{
 const {pool,log}=db();const r=await revokeIneligibleOrder({pool,orderId});
 assert.equal(r.revoked,1);assert(log.some(x=>x.q.includes('UPDATE sc_module_entitlements')));
 assert(log.some(x=>x.q.includes('pg_advisory_xact_lock')));
 assert(log.some(x=>x.q==='COMMIT'));
});
test('other active purchase preserves entitlement',async()=>{
 const {pool,log}=db({other:true});await revokeIneligibleOrder({pool,orderId});
 assert(!log.some(x=>x.q.includes('UPDATE sc_module_entitlements')));
});
test('eligible reviewed order cannot be revoked',async()=>{
 const {pool,log}=db({verified:true});
 await assert.rejects(revokeIneligibleOrder({pool,orderId}),/ineligible review required/);
 assert(log.some(x=>x.q==='ROLLBACK'));
});
test('untrusted refund signal without reconciled review cannot revoke',async()=>{
 const {pool}=db({reason:'fully_paid_eligible_order'});
 await assert.rejects(revokeIneligibleOrder({pool,orderId}),/ineligible review required/);
});
test('invalid order rejected before DB connection',async()=>{
 let connections=0;
 await assert.rejects(revokeIneligibleOrder({pool:{connect:()=>{connections++;}},orderId:'bad'}),/Invalid order ID/);
 assert.equal(connections,0);
});

test('stale review cannot revoke access',async()=>{
 const {pool,log}=db();
 const original=pool.connect;
 pool.connect=async()=>{
  const client=await original();const query=client.query;
  client.query=async(sql,args)=>{
   const result=await query(sql,args);
   if(sql.includes('FROM sc_shopify_order_reviews'))result.rows[0].checked_at='2023-01-01T00:00:00Z';
   return result;
  };return client;
 };
 await assert.rejects(revokeIneligibleOrder({pool,orderId}),/Fresh Shopify reconciliation required/);
 assert(!log.some(x=>x.q.includes('UPDATE sc_module_entitlements')));
});

test('partial refund never revokes entire order without item-level reconciliation',async()=>{
 const {pool,log}=db({reason:'partial_refund_requires_line_review'});
 await assert.rejects(revokeIneligibleOrder({pool,orderId}),/ineligible review required/);
 assert(!log.some(x=>x.q.includes('UPDATE sc_shopify_grants')));
});
test('payment pending is not proof of full refund and cannot revoke',async()=>{
 const {pool,log}=db({reason:'not_fully_paid'});
 await assert.rejects(revokeIneligibleOrder({pool,orderId}),/ineligible review required/);
 assert(!log.some(x=>x.q.includes('UPDATE sc_shopify_grants')));
});
test('full refund is eligible for revocation when freshly verified',async()=>{
 const {pool}=db({reason:'refunded'});
 const r=await revokeIneligibleOrder({pool,orderId});
 assert.equal(r.revoked,1);
});

test('module lock is acquired before grant updates and entitlement changes',async()=>{
 const {pool,log}=db({reason:'refunded'});
 await revokeIneligibleOrder({pool,orderId});
 const lockIndex=log.findIndex(x=>x.q.includes('pg_advisory_xact_lock'));
 const writeIndex=log.findIndex(x=>x.q.includes('UPDATE sc_shopify_grants'));
 const entitlementIndex=log.findIndex(x=>x.q.includes('UPDATE sc_module_entitlements'));
 assert(lockIndex>=0);
 assert(writeIndex>lockIndex);
 assert(entitlementIndex>writeIndex);
});
