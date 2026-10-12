import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHmac,randomUUID} from 'node:crypto';
const db=process.env.SALECENTAR_TEST_DATABASE_URL;
if(process.env.SALECENTAR_REQUIRE_DB_TESTS==='true'&&!db) throw Error('PostgreSQL tests required but SALECENTAR_TEST_DATABASE_URL missing');
test('PostgreSQL: signed intake, idempotency, verified payment and full summary', {skip:!db}, async()=>{
 const pg=(await import('pg')).default;
 const menuSecret='m'.repeat(40),zeroSecret='z'.repeat(40),admin='a'.repeat(40);
 const port=31999;
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,
  SALECENTAR_DATABASE_URL:db,SALECENTAR_MENU_SNAP_SECRET:menuSecret,
  SALECENTAR_ZERO_BUDGET_SECRET:zeroSecret,SALECENTAR_ADMIN_TOKEN:admin,SALECENTAR_ALLOW_LEGACY_ADMIN:'true',SALECENTAR_PORT:String(port)},stdio:'pipe'});
 const base=`http://127.0.0.1:${port}`;
 const wait=async()=>{for(let i=0;i<60;i++){if(child.exitCode!==null)throw Error('server exited');try{if((await fetch(base+'/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('server timeout');};
 const orderId=randomUUID(),body=JSON.stringify({format:'salecentar-pilot-v1',orders:[{order_id:orderId,customer_email:'test@example.org',offer_code:'MENU_SNAP_STARTER',price_cents:14900,currency:'EUR',status:'pending'}]});
 const signed=async(secret,stamp=Date.now())=>fetch(base+'/sync/menu-snap',{method:'POST',headers:{'x-wdc-timestamp':String(stamp),'x-wdc-signature':'sha256='+createHmac('sha256',secret).update(stamp+'.'+body).digest('hex')},body});
 try{
  await wait();
  assert.equal((await signed(zeroSecret)).status,401);
  assert.equal((await signed(menuSecret,Date.now()-400000)).status,401);
  assert.equal((await signed(menuSecret)).status,200);
  const repeated=await (await signed(menuSecret)).json();
  assert.equal(repeated.created,0);
  const adminHeaders={authorization:`Bearer ${admin}`,'content-type':'application/json'};
  const orders=await (await fetch(base+'/admin/orders',{headers:adminHeaders})).json();
  assert.ok(orders.orders.some(x=>x.source_order_id===orderId&&x.status==='pending'));
  const verify=await fetch(base+'/admin/payments/verify',{method:'POST',headers:adminHeaders,body:JSON.stringify({source:'menu-snap',order_id:orderId,status:'paid',reference:'independent-receipt-123'})});
  assert.equal(verify.status,200);
  assert.equal((await signed(menuSecret)).status,200);
  const after=await (await fetch(base+'/admin/orders',{headers:adminHeaders})).json();
  assert.equal(after.orders.find(x=>x.source_order_id===orderId).status,'paid');
  assert.ok(after.summary.some(x=>x.source==='menu-snap'&&x.status==='paid'));
 }finally{
  child.kill('SIGTERM');
  const pool=new pg.Pool({connectionString:db});
  await pool.query('DELETE FROM salecentar_payment_events WHERE source_order_id=$1',[orderId]);
  await pool.query('DELETE FROM salecentar_orders WHERE source_order_id=$1',[orderId]);
  await pool.end();
 }
});
