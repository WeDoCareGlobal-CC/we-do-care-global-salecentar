import {createHmac,timingSafeEqual} from 'node:crypto';
export const allowedStatuses=new Set(['pending','cancelled']);
export function validateOrder(x){
 if(!x||typeof x!=='object'||Array.isArray(x)) throw Error('Invalid order');
 if(typeof x.order_id!=='string'||!/^[0-9a-f-]{36}$/i.test(x.order_id))throw Error('Invalid order ID');
 if(typeof x.customer_email!=='string'||x.customer_email.length>254||!/^\S+@\S+\.\S+$/.test(x.customer_email))throw Error('Invalid customer');
 if(x.offer_code!=='MENU_SNAP_STARTER'||!Number.isSafeInteger(x.price_cents)||x.price_cents<0||x.price_cents>100000000)throw Error('Invalid offer/price');
 if(x.currency!=='EUR'||!allowedStatuses.has(x.status))throw Error('Only pending or cancelled orders may be imported');
 return {source:'menu-snap',source_order_id:x.order_id,customer_email:x.customer_email,offer_code:x.offer_code,price_cents:x.price_cents,currency:x.currency,status:x.status,external_payment_reference:null,source_created_at:typeof x.created_at==='string'&&!Number.isNaN(Date.parse(x.created_at))?x.created_at:null};
}
// ZeroBudget AI pilot orders are intake-only. Payment must be verified separately.
export function validateZeroBudgetOrder(x){
 if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid order');
 if(typeof x.order_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x.order_id))throw Error('Invalid order ID');
 if(typeof x.customer_email!=='string'||x.customer_email.length>254||!/^\S+@\S+\.\S+$/.test(x.customer_email))throw Error('Invalid customer');
 if(x.offer_code!=='ZERO_BUDGET_AI_DIGITAL_PACK')throw Error('Invalid offer');
 if(x.currency!=='EUR'||!Number.isSafeInteger(x.price_cents)||x.price_cents<0||x.price_cents>100000000)throw Error('Invalid price');
 if(x.status!=='pending')throw Error('Only pending orders may be imported');
 return {source:'zerobudget-ai',source_order_id:x.order_id,customer_email:x.customer_email,offer_code:x.offer_code,price_cents:x.price_cents,currency:'EUR',status:'pending',external_payment_reference:null,source_created_at:typeof x.created_at==='string'&&!Number.isNaN(Date.parse(x.created_at))?x.created_at:null};
}
export function verifySignature(body,signature,secret){
 if(!secret||!signature||!/^sha256=[0-9a-f]{64}$/.test(signature))return false;
 const expected='sha256='+createHmac('sha256',secret).update(body).digest('hex');
 return timingSafeEqual(Buffer.from(expected),Buffer.from(signature));
}
export function summarize(orders){
 return {orders:orders.length,paid:orders.filter(x=>x.status==='paid').length,pending:orders.filter(x=>x.status==='pending').length,verifiedRevenueCents:orders.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.price_cents),0),currency:'EUR'};
}

export function verifyTimestampedSignature(body, signature, secret, timestamp, now = Date.now()) {
 const n=Number(timestamp);
 if (!Number.isSafeInteger(n)||Math.abs(now-n)>5*60*1000) return false;
 return verifySignature(Buffer.concat([Buffer.from(String(n)+'.'),body]),signature,secret);
}
export function allowedTransition(previous,next) {
 return (previous==='pending' && ['paid','cancelled'].includes(next)) ||
        (previous==='paid' && next==='refunded');
}
