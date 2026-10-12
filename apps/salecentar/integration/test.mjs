import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {validateOrder,validateZeroBudgetOrder,verifySignature,summarize,verifyTimestampedSignature,allowedTransition} from './logic.mjs';
const row={order_id:'550e8400-e29b-41d4-a716-446655440000',customer_email:'buyer@example.org',offer_code:'MENU_SNAP_STARTER',price_cents:14900,currency:'EUR',status:'pending',created_at:'2026-10-12T10:00:00Z'};
test('accepts valid Menu Snap order',()=>assert.equal(validateOrder(row).source,'menu-snap'));
test('rejects unverified paid state',()=>assert.throws(()=>validateOrder({...row,status:'paid'})));
test('rejects negative price',()=>assert.throws(()=>validateOrder({...row,price_cents:-1})));
test('rejects unregistered offer',()=>assert.throws(()=>validateOrder({...row,offer_code:'FAKE'})));
test('validates signed request bytes',()=>{const secret='a'.repeat(32),body=Buffer.from('{"orders":[]}'),sig='sha256='+createHmac('sha256',secret).update(body).digest('hex');assert.equal(verifySignature(body,sig,secret),true);assert.equal(verifySignature(Buffer.from('tampered'),sig,secret),false);});
test('revenue counts only paid orders',()=>assert.equal(summarize([{status:'pending',price_cents:14900},{status:'paid',price_cents:9900}]).verifiedRevenueCents,9900));


const zb={order_id:'550e8400-e29b-41d4-a716-446655440001',customer_email:'buyer@example.org',offer_code:'ZERO_BUDGET_AI_DIGITAL_PACK',price_cents:2900,currency:'EUR',status:'pending'};
test('accepts ZeroBudget AI pending order',()=>assert.equal(validateZeroBudgetOrder(zb).source,'zerobudget-ai'));
test('rejects ZeroBudget AI unverified paid status',()=>assert.throws(()=>validateZeroBudgetOrder({...zb,status:'paid'})));
test('rejects ZeroBudget AI unknown offer',()=>assert.throws(()=>validateZeroBudgetOrder({...zb,offer_code:'OTHER'})));
test('rejects ZeroBudget AI invalid identifier',()=>assert.throws(()=>validateZeroBudgetOrder({...zb,order_id:'bad'})));

test('rejects imported paid Menu Snap status',()=>assert.throws(()=>validateOrder({...row,status:'paid',external_payment_reference:'fake'})));
test('rejects imported refunded Menu Snap status',()=>assert.throws(()=>validateOrder({...row,status:'refunded'})));
test('source cannot import a payment reference',()=>assert.equal(validateOrder({...row,external_payment_reference:'not-verified'}).external_payment_reference,null));
test('accepts fresh timestamped HMAC',()=>{
 const body=Buffer.from('{"format":"salecentar-pilot-v1"}'),secret='a'.repeat(32),t=Date.now();
 const signature='sha256='+createHmac('sha256',secret).update(t+'.').update(body).digest('hex');
 assert.equal(verifyTimestampedSignature(body,signature,secret,String(t),t),true);
 assert.equal(verifyTimestampedSignature(body,signature,secret,String(t),t+6*60*1000),false);
 assert.equal(verifyTimestampedSignature(Buffer.from('tamper'),signature,secret,String(t),t),false);
});
test('payment state transitions are explicit',()=>{
 assert.equal(allowedTransition('pending','paid'),true);
 assert.equal(allowedTransition('paid','refunded'),true);
 assert.equal(allowedTransition('pending','refunded'),false);
 assert.equal(allowedTransition('paid','pending'),false);
 assert.equal(allowedTransition('paid','paid'),false);
});
