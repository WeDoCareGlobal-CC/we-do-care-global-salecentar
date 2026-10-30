import test from 'node:test';
import assert from 'node:assert/strict';
import {revokeIneligibleOrder} from './shopify-revoke-tx.mjs';
const orderId='gid://shopify/Order/123',user='ae2c3654-4567-4567-8567-123456789abc';
function db({verified=false,reason='cancelled',other=false}={}){
 const log=[];
 return {log,pool:{connect:async()=>({query:async(q,args)=>{
  log.push({q,args});
  if(q.includes('FROM sc_shopify_order_reviews'))return {rowCount:1,rows:[{verified,reason}]};
  if(q.includes('UPDATE sc_shopify_grants'))return {rowCount:1,rows:[{user_id:user,module_id:'muse-flow'}]};
  if(q.includes('SELECT 1 FROM sc_shopify_grants'))return {rowCount:other?1:0,rows:[]};
  return {rowCount:1,rows:[]};
 },release:()=>{}})}};
}
test('unpaid or cancelled verified review revokes access when no other grant',async()=>{
 const {pool,log}=db();const r=await revokeIneligibleOrder({pool,orderId});
 assert.equal(r.revoked,1);assert(log.some(x=>x.q.includes('UPDATE sc_module_entitlements')));
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
