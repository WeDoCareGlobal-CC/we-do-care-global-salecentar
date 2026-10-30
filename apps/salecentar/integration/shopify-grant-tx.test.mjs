import test from 'node:test';
import assert from 'node:assert/strict';
import {grantVerifiedOneTimeOrder} from './shopify-grant-tx.mjs';
const orderId='gid://shopify/Order/123',variantId='gid://shopify/ProductVariant/456';
const userId='ae2c3654-4567-4567-8567-123456789abc';
const row={order_id:orderId,customer_id:'gid://shopify/Customer/789',
 verified:true,reason:'fully_paid_eligible_order',eligible_lines:[{variantId,quantity:1}],checked_at:new Date().toISOString(),
 user_id:userId,verified_at:'2026-10-30T00:00:00Z',active:true};
function mockDb({entry=row,previous=false,failInsert=false,protectedManual=false}={}){
 const calls=[];
 const client={query:async(sql,args)=>{
  calls.push({sql,args});
  if(sql.includes('FROM sc_shopify_order_reviews'))return {rowCount:entry?1:0,rows:entry?[entry]:[]};
  if(sql.includes('FROM sc_shopify_grants'))return {rowCount:previous?1:0,rows:previous?[{order_id:orderId,variant_id:variantId}]:[]};
  if(sql.includes('INSERT INTO sc_shopify_grants'))return {rowCount:failInsert?0:1};
  if(sql.includes('INSERT INTO sc_module_entitlements'))return {rowCount:protectedManual?0:1};
  return {rowCount:1};
 },release(){calls.push({sql:'RELEASE'});}};
 return {pool:{connect:async()=>client},calls};
}
test('verified linked one-time purchase grants transactionally',async()=>{
 const {pool,calls}=mockDb();const r=await grantVerifiedOneTimeOrder({pool,orderId,variantId,moduleId:'muse-flow',enforcedModules:new Set(['muse-flow']),approvedOffers:new Map([[variantId,'muse-flow']])});
 assert.equal(r.granted,true);assert(calls.some(c=>c.sql==='COMMIT'));
 assert(calls.some(c=>c.sql.includes('INSERT INTO sc_module_entitlements')));
});
test('unverified purchase denied',async()=>{
 const {pool,calls}=mockDb({entry:{...row,verified:false}});
 await assert.rejects(grantVerifiedOneTimeOrder({pool,orderId,variantId,moduleId:'muse-flow',enforcedModules:new Set(['muse-flow']),approvedOffers:new Map([[variantId,'muse-flow']])}));
 assert(calls.some(c=>c.sql==='ROLLBACK'));
 assert(!calls.some(c=>c.sql.includes('INSERT INTO sc_module_entitlements')));
});
test('unlinked customer denied',async()=>{
 const {pool,calls}=mockDb({entry:{...row,user_id:null}});
 await assert.rejects(grantVerifiedOneTimeOrder({pool,orderId,variantId,moduleId:'muse-flow',enforcedModules:new Set(['muse-flow']),approvedOffers:new Map([[variantId,'muse-flow']])}));
 assert(!calls.some(c=>c.sql.includes('INSERT INTO sc_module_entitlements')));
});
test('duplicate purchase denied',async()=>{
 const {pool,calls}=mockDb({previous:true});
 await assert.rejects(grantVerifiedOneTimeOrder({pool,orderId,variantId,moduleId:'muse-flow',enforcedModules:new Set(['muse-flow']),approvedOffers:new Map([[variantId,'muse-flow']])}));
 assert(!calls.some(c=>c.sql.includes('INSERT INTO sc_module_entitlements')));
});
test('write collision rolls back',async()=>{
 const {pool,calls}=mockDb({failInsert:true});
 await assert.rejects(grantVerifiedOneTimeOrder({pool,orderId,variantId,moduleId:'muse-flow',enforcedModules:new Set(['muse-flow']),approvedOffers:new Map([[variantId,'muse-flow']])}));
 assert(calls.some(c=>c.sql==='ROLLBACK'));
 assert(!calls.some(c=>c.sql.includes('INSERT INTO sc_module_entitlements')));
});

test('unverified module enforcement denies before any DB calls',async()=>{
 let calls=0;
 await assert.rejects(grantVerifiedOneTimeOrder({pool:{connect:async()=>{calls++;}},orderId,variantId,moduleId:'muse-flow'}),/enforcement not verified/);
 assert.equal(calls,0);
});

test('wrong variant-to-module mapping cannot reach database',async()=>{
 let calls=0;
 await assert.rejects(grantVerifiedOneTimeOrder({pool:{connect:async()=>{calls++;}},orderId,variantId,moduleId:'muse-flow',
  enforcedModules:new Set(['muse-flow']),approvedOffers:new Map([[variantId,'speech-generator']])}),/mapping not verified/);
 assert.equal(calls,0);
});
test('stale payment verification cannot grant access',async()=>{
 const {pool,calls}=mockDb({entry:{...row,checked_at:'2024-01-01T00:00:00Z'}});
 await assert.rejects(grantVerifiedOneTimeOrder({pool,orderId,variantId,moduleId:'muse-flow',
  enforcedModules:new Set(['muse-flow']),approvedOffers:new Map([[variantId,'muse-flow']])}),/Fresh Shopify payment reconciliation required/);
 assert(calls.some(c=>c.sql==='ROLLBACK'));
 assert(!calls.some(c=>c.sql.includes('INSERT INTO sc_module_entitlements')));
});

test('active manually managed entitlement is not overwritten',async()=>{
 const {pool,calls}=mockDb({protectedManual:true});
 await assert.rejects(grantVerifiedOneTimeOrder({
  pool,orderId,variantId,moduleId:'muse-flow',
  enforcedModules:new Set(['muse-flow']),
  approvedOffers:new Map([[variantId,'muse-flow']])
 }),/independently managed entitlement/);
 assert(calls.some(c=>c.sql==='ROLLBACK'));
 assert(!calls.some(c=>c.sql==='COMMIT'));
});
