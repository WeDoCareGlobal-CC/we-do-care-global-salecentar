import http from 'node:http';
import {validateHermesSettlement,sameHermesSettlement,classifyHermesBalances} from './hermes-policy.mjs';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {randomUUID, timingSafeEqual, randomBytes, scryptSync, createHash} from 'node:crypto';
import {validateOrder,validateZeroBudgetOrder,verifyTimestampedSignature,allowedTransition} from './logic.mjs';
const {Pool}=pg;
const keys={'menu-snap':process.env.SALECENTAR_MENU_SNAP_SECRET,'zerobudget-ai':process.env.SALECENTAR_ZERO_BUDGET_SECRET};
const museAuthSecret=process.env.SALECENTAR_MUSE_FLOW_SECRET;
const speechAuthSecret=process.env.SALECENTAR_SPEECH_GENERATOR_SECRET;
const hermesAuthSecret=process.env.SALECENTAR_HERMES_SECRET;
const adminToken=process.env.SALECENTAR_ADMIN_TOKEN;
const databaseUrl=process.env.SALECENTAR_DATABASE_URL;
if(Object.values(keys).some(v=>!v||v.length<32)||keys['menu-snap']===keys['zerobudget-ai']||(process.env.SALECENTAR_ALLOW_LEGACY_ADMIN==='true'&&(!adminToken||adminToken.length<32))||!databaseUrl)
 throw Error('Set distinct source secrets, admin token and database URL');
const pool=new Pool({connectionString:databaseUrl,ssl:process.env.PG_SSL==='true'?{rejectUnauthorized:true}:undefined});
await pool.query(`CREATE TABLE IF NOT EXISTS salecentar_orders(
 source TEXT NOT NULL,source_order_id UUID NOT NULL,customer_email TEXT NOT NULL,
 offer_code TEXT NOT NULL,price_cents INTEGER NOT NULL,currency TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',external_payment_reference TEXT,
 source_created_at TIMESTAMPTZ,updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(source,source_order_id))`);
await pool.query(`CREATE TABLE IF NOT EXISTS salecentar_payment_events(
 id UUID PRIMARY KEY,source TEXT NOT NULL,source_order_id UUID NOT NULL,
 old_status TEXT NOT NULL,new_status TEXT NOT NULL,reference TEXT NOT NULL,
 actor TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(source,source_order_id) REFERENCES salecentar_orders(source,source_order_id))`);
await pool.query(`CREATE TABLE IF NOT EXISTS sc_hermes_settlements(
 network TEXT NOT NULL,tx_hash TEXT NOT NULL,nonce TEXT NOT NULL,
 asset TEXT NOT NULL,amount_atomic NUMERIC(78,0) NOT NULL CHECK(amount_atomic>0),
 payer TEXT NOT NULL,pay_to TEXT NOT NULL,resource TEXT NOT NULL,
 settlement_mode TEXT NOT NULL CHECK(settlement_mode IN ('facilitator_reported','simulated','unverified')),
 source_created_at TIMESTAMPTZ,ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(network,nonce),UNIQUE(network,tx_hash,asset)
)`); 
await pool.query(`CREATE TABLE IF NOT EXISTS sc_users(
 id UUID PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','viewer')),active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
await pool.query(`CREATE TABLE IF NOT EXISTS sc_sessions(
 token_hash TEXT PRIMARY KEY,user_id UUID NOT NULL REFERENCES sc_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
await pool.query(`CREATE TABLE IF NOT EXISTS sc_module_entitlements(
 user_id UUID NOT NULL REFERENCES sc_users(id) ON DELETE CASCADE,
 module_id TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT false,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,module_id))`);
await pool.query(`CREATE TABLE IF NOT EXISTS sc_speech_usage(
 request_id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES sc_users(id) ON DELETE CASCADE,
 day DATE NOT NULL, status TEXT NOT NULL CHECK(status IN ('reserved','succeeded','failed')),
 characters INTEGER NOT NULL CHECK(characters BETWEEN 1 AND 3000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ)`);
const moduleIds=new Set(['menu-snap','zerobudget-ai','muse-flow','hermes-x402','speech-generator']);
const speechLimit=Number(process.env.SPEECH_DAILY_LIMIT||20);
if(!Number.isInteger(speechLimit)||speechLimit<1||speechLimit>100000)throw Error('Invalid SPEECH_DAILY_LIMIT');
const respond=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"});res.end(JSON.stringify(obj));};
const read=async req=>{let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>256*1024)throw Error('Payload too large');chunks.push(chunk);}return Buffer.concat(chunks);};
const eq=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);};
const hashToken=t=>createHash('sha256').update(t).digest('hex');
const passwordHash=(password,salt=randomBytes(16).toString('hex'))=>salt+':'+scryptSync(password,salt,64).toString('hex');
const checkPassword=(password,stored)=>{
 const [salt,expected]=String(stored).split(':');
 if(!salt||!expected||!/^[a-f0-9]{128}$/.test(expected))return false;
 return eq(scryptSync(password,salt,64).toString('hex'),expected);
};
const authorized=async(req,role='viewer')=>{
 const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
 if(!token)return false;
 if(process.env.SALECENTAR_ALLOW_LEGACY_ADMIN==='true'&&eq(token,adminToken))return true;
 const q=await pool.query(`SELECT u.role FROM sc_sessions s JOIN sc_users u ON u.id=s.user_id
 WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[hashToken(token)]);
 return !!q.rowCount&&(role==='viewer'||q.rows[0].role==='admin');
};
const clamp=(s,d,max)=>Number.isInteger(Number(s))?Math.max(0,Math.min(max,Number(s))):d;
const loginAttempts=new Map();
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='POST'&&url.pathname==='/sync/hermes'){
   const secret=process.env.SALECENTAR_HERMES_SECRET;
   if(!secret||secret.length<32)return respond(res,503,{error:'Hermes integration disabled'});
   const raw=await read(req);
   const stamp=String(req.headers['x-wdc-timestamp']||'');
   const signature=String(req.headers['x-wdc-signature']||'');
   const {createHmac}=await import('node:crypto');
   if(!/^\\d{13}$/.test(stamp)||Math.abs(Date.now()-Number(stamp))>300000||
      !eq(signature,'sha256='+createHmac('sha256',secret).update(stamp+'.').update(raw).digest('hex')))
    return respond(res,401,{error:'Invalid signature or timestamp'});
   const payload=JSON.parse(raw.toString('utf8'));
   if(payload?.format!=='wdcg-hermes-settlements-v1'||!Array.isArray(payload.settlements)||payload.settlements.length>100)
    return respond(res,400,{error:'Invalid batch'});
   if(!payload.settlements.every(validateHermesSettlement))return respond(res,400,{error:'Invalid settlement'});
   const client=await pool.connect();let created=0;
   try{
    await client.query('BEGIN');
    for(const x of payload.settlements){
     const existing=await client.query('SELECT * FROM sc_hermes_settlements WHERE network=$1 AND nonce=$2',[x.network,x.nonce]);
     if(existing.rowCount){
      const y=existing.rows[0];
      if(!sameHermesSettlement(y,x))
       {await client.query('ROLLBACK');return respond(res,409,{error:'Conflicting settlement replay'});}
      continue;
     }
     await client.query(`INSERT INTO sc_hermes_settlements
      (network,tx_hash,nonce,asset,amount_atomic,payer,pay_to,resource,settlement_mode,source_created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [x.network,x.tx_hash,x.nonce,x.asset,x.amount_atomic,x.payer,x.pay_to,x.resource,x.settlement_mode,x.source_created_at||null]);
     created++;
    }
    await client.query('COMMIT');
    return respond(res,200,{created,received:payload.settlements.length});
   }catch(e){await client.query('ROLLBACK');if(e.code==='23505')return respond(res,409,{error:'Duplicate transaction'});throw e;}
   finally{client.release();}
  }
  if(req.method==='GET'&&url.pathname==='/admin/hermes/summary'){
   if(!await authorized(req))return respond(res,403,{error:'Forbidden'});
   const q=await pool.query(`SELECT settlement_mode,network,asset,COUNT(*)::int AS count,
      SUM(amount_atomic)::text AS amount_atomic FROM sc_hermes_settlements
      GROUP BY settlement_mode,network,asset ORDER BY settlement_mode,network,asset`);
   return respond(res,200,{balances:q.rows,classification:classifyHermesBalances(q.rows),notice:'No independently verified blockchain revenue; amounts are atomic token units, not converted to fiat'});
  }
  if(req.method==='POST'&&url.pathname==='/admin/entitlements'){
   if(!await authorized(req,'admin'))return respond(res,403,{error:'Admin required'});
   const data=JSON.parse((await read(req)).toString('utf8'));
   if(!/^[0-9a-f-]{36}$/i.test(data?.user_id||'')||!moduleIds.has(data?.module_id)||typeof data?.enabled!=='boolean')
    return respond(res,400,{error:'Invalid entitlement'});
   const q=await pool.query(`INSERT INTO sc_module_entitlements(user_id,module_id,enabled)
    VALUES($1,$2,$3) ON CONFLICT(user_id,module_id) DO UPDATE SET enabled=excluded.enabled,updated_at=now()
    RETURNING user_id,module_id,enabled`,[data.user_id,data.module_id,data.enabled]);
   return respond(res,200,{entitlement:q.rows[0]});
  }
  if(req.method==='POST'&&url.pathname==='/internal/speech/usage/reserve'){
   if(!speechAuthSecret||!eq(req.headers['x-salecentar-service-key'],speechAuthSecret))
    return respond(res,401,{error:'Unauthorized service'});
   const data=JSON.parse((await read(req)).toString('utf8'));
   if(!/^[0-9a-f-]{36}$/i.test(data?.request_id||'')||!Number.isInteger(data?.characters)||data.characters<1||data.characters>3000)
    return respond(res,400,{error:'Invalid usage request'});
   const token=typeof data.token==='string'&&/^[A-Za-z0-9_-]{32,}$/.test(data.token)?data.token:null;
   if(!token)return respond(res,401,{error:'Invalid session'});
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    const q=await client.query(`SELECT u.id,u.role FROM sc_sessions s JOIN sc_users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[hashToken(token)]);
    if(!q.rowCount){await client.query('ROLLBACK');return respond(res,401,{error:'Session expired'});}
    const user=q.rows[0];
    const grant=await client.query(`SELECT enabled FROM sc_module_entitlements WHERE user_id=$1 AND module_id='speech-generator'`,[user.id]);
    if(user.role!=='admin'&&!grant.rows[0]?.enabled){await client.query('ROLLBACK');return respond(res,403,{error:'Speech access not granted'});}
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user.id+':speech']);
    const used=await client.query(`SELECT COUNT(*)::int AS used FROM sc_speech_usage WHERE user_id=$1 AND day=(now() AT TIME ZONE 'UTC')::date`,[user.id]);
    if(used.rows[0].used>=speechLimit){await client.query('ROLLBACK');return respond(res,429,{error:'Daily limit reached'});}
    await client.query(`INSERT INTO sc_speech_usage(request_id,user_id,day,status,characters)
      VALUES($1,$2,(now() AT TIME ZONE 'UTC')::date,'reserved',$3)`,[data.request_id,user.id,data.characters]);
    await client.query('COMMIT');
    return respond(res,200,{request_id:data.request_id,used:used.rows[0].used+1,limit:speechLimit});
   }catch(e){await client.query('ROLLBACK');if(e.code==='23505')return respond(res,409,{error:'Duplicate request id'});throw e;}
   finally{client.release();}
  }
  if(req.method==='POST'&&url.pathname==='/internal/speech/usage/finish'){
   if(!speechAuthSecret||!eq(req.headers['x-salecentar-service-key'],speechAuthSecret))
    return respond(res,401,{error:'Unauthorized service'});
   const data=JSON.parse((await read(req)).toString('utf8'));
   if(!/^[0-9a-f-]{36}$/i.test(data?.request_id||'')||!['succeeded','failed'].includes(data?.status))
    return respond(res,400,{error:'Invalid completion'});
   const q=await pool.query(`UPDATE sc_speech_usage SET status=$2,finished_at=now()
    WHERE request_id=$1 AND status='reserved' RETURNING request_id`,[data.request_id,data.status]);
   return respond(res,q.rowCount?200:409,q.rowCount?{ok:true}:{error:'Unknown or completed request'});
  }
  if(req.method==='GET'&&url.pathname==='/health')
   return respond(res,200,{ok:true,mode:process.env.SALECENTAR_TEST_ENV==='1'?'test':'standard'});
  if(req.method==='POST'&&url.pathname==='/auth/bootstrap'){
   const data=JSON.parse((await read(req)).toString('utf8'));
   const secret=process.env.SALECENTAR_BOOTSTRAP_SECRET;
   if(!secret||secret.length<32||!eq(data?.bootstrap_secret,secret))return respond(res,403,{error:'Bootstrap forbidden'});
   if(typeof data?.email!=='string'||!/^\\S+@\\S+\\.\\S+$/.test(data.email)||typeof data?.password!=='string'||data.password.length<14)
    return respond(res,400,{error:'Email and 14+ character password required'});
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    await client.query('LOCK TABLE sc_users IN EXCLUSIVE MODE');
    if((await client.query('SELECT 1 FROM sc_users LIMIT 1')).rowCount){
     await client.query('ROLLBACK');return respond(res,409,{error:'Already initialized'});
    }
    await client.query('INSERT INTO sc_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)',
     [randomUUID(),data.email.toLowerCase(),passwordHash(data.password),'admin']);
    await client.query('COMMIT');
    return respond(res,201,{ok:true});
   }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  }
  if(req.method==='POST'&&url.pathname==='/auth/login'){
   const ip=req.socket.remoteAddress||'unknown';
   const attempt=loginAttempts.get(ip);
   if(attempt&&attempt.until>Date.now()&&attempt.count>=8)return respond(res,429,{error:'Too many login attempts'});
   if(!attempt||attempt.until<=Date.now())loginAttempts.set(ip,{count:0,until:Date.now()+15*60_000});
   const data=JSON.parse((await read(req)).toString('utf8'));
   if(typeof data?.email!=='string'||typeof data?.password!=='string'||data.email.length>254||data.password.length>1024)
    return respond(res,400,{error:'Invalid credentials'});
   const q=await pool.query('SELECT id,password_hash,role FROM sc_users WHERE email=$1 AND active=true',[data.email.toLowerCase()]);
   if(!q.rowCount||!checkPassword(data.password,q.rows[0].password_hash)){loginAttempts.get(ip).count++;return respond(res,401,{error:'Invalid credentials'});}
   loginAttempts.delete(ip);
   const token=randomBytes(32).toString('base64url');
   await pool.query(`INSERT INTO sc_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')`,
    [hashToken(token),q.rows[0].id]);
   return respond(res,200,{token,role:q.rows[0].role,expires_in:28800});
  }
  // Internal entitlement check: module services may call this to verify user module grants.
  if(req.method==='POST'&&url.pathname==='/internal/auth/entitlement'){
   const moduleName=req.headers['x-salecentar-module'];
   const moduleSecret=moduleName==='muse-flow'?museAuthSecret:moduleName==='speech-generator'?speechAuthSecret:moduleName==='hermes-x402'?hermesAuthSecret:keys[moduleName];
   if(!moduleSecret||!eq(req.headers['x-salecentar-service-key'],moduleSecret))
    return respond(res,401,{error:'Unauthorized service'});
   const data=JSON.parse((await read(req)).toString('utf8'));
   const userId=typeof data?.user_id==='string'&&/^[0-9a-f-]{36}$/i.test(data.user_id)?data.user_id:null;
   if(!userId)return respond(res,400,{error:'Invalid user_id'});
   const q=await pool.query(`SELECT enabled FROM sc_module_entitlements WHERE user_id=$1 AND module_id=$2`,[userId,moduleName]);
   return respond(res,200,{enabled:q.rows[0]?.enabled===true});
  }

  // Internal session introspection: only the registered module services may call this.
  // No session token is logged or returned to the module.
  if(req.method==='POST'&&url.pathname==='/internal/auth/introspect'){
   const moduleName=req.headers['x-salecentar-module'];
   const moduleSecret=moduleName==='muse-flow'?museAuthSecret:moduleName==='speech-generator'?speechAuthSecret:moduleName==='hermes-x402'?hermesAuthSecret:keys[moduleName];
   if(!moduleSecret||!eq(req.headers['x-salecentar-service-key'],moduleSecret))
    return respond(res,401,{error:'Unauthorized service'});
   const data=JSON.parse((await read(req)).toString('utf8'));
   const token=typeof data?.token==='string'&&/^[A-Za-z0-9_-]{32,}$/.test(data.token)?data.token:null;
   if(!token)return respond(res,401,{active:false});
   const q=await pool.query(`SELECT u.id,u.email,u.role FROM sc_sessions s
    JOIN sc_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[hashToken(token)]);
   res.setHeader('Cache-Control','no-store');
   if(!q.rowCount)return respond(res,401,{active:false});
   return respond(res,200,{active:true,user:q.rows[0]});
  }
  if(req.method==='POST'&&url.pathname==='/auth/logout'){
   const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
   if(token)await pool.query('DELETE FROM sc_sessions WHERE token_hash=$1',[hashToken(token)]);
   return respond(res,200,{ok:true});
  }
  if(req.method==='GET'&&url.pathname==='/portal'){
   const page=await readFile(new URL('./portal.html',import.meta.url));
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});
   return res.end(page);
  }
  if(req.method==='GET'&&url.pathname==='/portal.js'){
   const js=await readFile(new URL('./portal.js',import.meta.url));
   res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return res.end(js);
  }
  if(req.method==='GET'&&url.pathname==='/portal/api/me'){
   const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
   if(!token)return respond(res,401,{error:'Sign in required'});
   const q=await pool.query(`SELECT u.id,u.email,u.role FROM sc_sessions s JOIN sc_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[hashToken(token)]);
   if(!q.rowCount)return respond(res,401,{error:'Session expired'});
   return respond(res,200,{user:q.rows[0]});
  }
  if(req.method==='GET'&&url.pathname==='/portal/api/modules'){
   const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
   if(!token)return respond(res,401,{error:'Sign in required'});
   const q=await pool.query(`SELECT u.id FROM sc_sessions s JOIN sc_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[hashToken(token)]);
   if(!q.rowCount)return respond(res,401,{error:'Session expired'});
   const catalog=JSON.parse(await readFile(new URL('../../../catalog/products.json',import.meta.url),'utf8'));
   const grants=await pool.query('SELECT module_id,enabled FROM sc_module_entitlements WHERE user_id=$1',[q.rows[0].id]);
   const enabled=new Map(grants.rows.map(x=>[x.module_id,x.enabled]));
   return respond(res,200,{modules:catalog.products.map(({id,name,status,notes})=>({id,name,status,notes,access:enabled.get(id)===true})),entitlementsConfigured:true});

  }
  if(req.method==='GET'&&url.pathname==='/portal/api/usage'){
   const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
   if(!token)return respond(res,401,{error:'Sign in required'});
   const q=await pool.query(`SELECT u.id FROM sc_sessions s JOIN sc_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[hashToken(token)]);
   if(!q.rowCount)return respond(res,401,{error:'Session expired'});
   const usage=await pool.query(`SELECT day::text AS day,status,COUNT(*)::int AS requests,
    SUM(characters)::int AS characters FROM sc_speech_usage WHERE user_id=$1 AND day>=(now() AT TIME ZONE 'UTC')::date-INTERVAL '30 days'
    GROUP BY day,status ORDER BY day DESC,status`,[q.rows[0].id]);
   return respond(res,200,{speech:usage.rows,timezone:'UTC',note:'Attempts counted, including failed provider calls'});
  }
  if(req.method==='GET'&&url.pathname==='/control'){
   const page=await readFile(new URL('./control.html',import.meta.url));
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",'Referrer-Policy':'no-referrer'});
   return res.end(page);
  }
  if(req.method==='GET'&&url.pathname==='/control.js'){
   const js=await readFile(new URL('./control.js',import.meta.url));
   res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return res.end(js);
  }
  if(req.method==='GET'&&url.pathname==='/control.css'){
   const css=await readFile(new URL('./control.css',import.meta.url));
   res.writeHead(200,{'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return res.end(css);
  }
  if(req.method==='POST'&&['/sync/menu-snap','/sync/zerobudget-ai'].includes(url.pathname)){
   const source=url.pathname.split('/')[2];
   const raw=await read(req);
   if(!verifyTimestampedSignature(raw,req.headers['x-wdc-signature'],keys[source],req.headers['x-wdc-timestamp']))
    return respond(res,401,{error:'Invalid or expired signature'});
   const input=JSON.parse(raw.toString('utf8'));
   if(input?.format!=='salecentar-pilot-v1'||!Array.isArray(input.orders)||input.orders.length>100)
    return respond(res,400,{error:'Invalid payload'});
   const rows=input.orders.map(source==='menu-snap'?validateOrder:validateZeroBudgetOrder);
   const client=await pool.connect();
   let accepted=0;
   try{
    await client.query('BEGIN');
    for(const o of rows){
     const r=await client.query(`INSERT INTO salecentar_orders(source,source_order_id,customer_email,offer_code,price_cents,currency,status,source_created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(source,source_order_id) DO NOTHING RETURNING source_order_id`,
      [o.source,o.source_order_id,o.customer_email,o.offer_code,o.price_cents,o.currency,o.status,o.source_created_at]);
     if(r.rowCount)accepted++;
     else {
      const old=await client.query(`SELECT customer_email,offer_code,price_cents,currency FROM salecentar_orders WHERE source=$1 AND source_order_id=$2`,
       [o.source,o.source_order_id]);
      if(!old.rowCount||old.rows[0].customer_email!==o.customer_email||old.rows[0].offer_code!==o.offer_code||
         old.rows[0].price_cents!==o.price_cents||old.rows[0].currency!==o.currency)
       throw Error('Order identifier conflicts with existing data');
     }
    }
    await client.query('COMMIT');
   }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
   return respond(res,200,{ok:true,received:rows.length,created:accepted});
  }
  if(url.pathname.startsWith('/admin/')){
   const needsAdmin=req.method==='POST'||req.method==='DELETE'||req.method==='PATCH';
   if(!await authorized(req,needsAdmin?'admin':'viewer'))return respond(res,401,{error:'Unauthorized'});
   if(req.method==='DELETE'&&url.pathname.startsWith('/admin/users/')){
    const userId=url.pathname.slice('/admin/users/'.length);
    if(!/^[0-9a-f-]{36}$/i.test(userId))return respond(res,400,{error:'Invalid user id'});
    const client=await pool.connect();
    try{
     await client.query('BEGIN');
     const target=await client.query('SELECT id,role FROM sc_users WHERE id=$1 FOR UPDATE',[userId]);
     if(!target.rowCount){await client.query('ROLLBACK');return respond(res,404,{error:'User not found'});}
     // Protected accounts: administrators may not be deleted through this
     // endpoint, which prevents both accidental and self-inflicted lockout.
     if(target.rows[0].role==='admin'){await client.query('ROLLBACK');return respond(res,403,{error:'Protected account cannot be deleted'});}
     await client.query('DELETE FROM sc_module_entitlements WHERE user_id=$1',[userId]);
     await client.query('DELETE FROM sc_sessions WHERE user_id=$1',[userId]);
     const r=await client.query('DELETE FROM sc_users WHERE id=$1',[userId]);
     if(!r.rowCount){await client.query('ROLLBACK');return respond(res,404,{error:'User not found'});}
     await client.query('COMMIT');
     return respond(res,200,{ok:true});
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
   }
   if(req.method==='POST'&&url.pathname==='/admin/users'){
    const input=JSON.parse((await read(req)).toString('utf8'));
    if(typeof input?.email!=='string'||!/^\S+@\S+\.\S+$/.test(input.email)||
       typeof input?.password!=='string'||input.password.length<14||!['admin','viewer'].includes(input.role))
     return respond(res,400,{error:'Invalid user'});
    await pool.query('INSERT INTO sc_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)',
     [randomUUID(),input.email.toLowerCase(),passwordHash(input.password),input.role]);
    return respond(res,201,{ok:true});
   }
   if(req.method==='GET'&&url.pathname==='/admin/orders'){
    const limit=clamp(url.searchParams.get('limit'),50,100)||50;
    const offset=clamp(url.searchParams.get('offset'),0,1000000);
    const source=url.searchParams.get('source');
    if(source&&!Object.hasOwn(keys,source))return respond(res,400,{error:'Invalid source'});
    const args=source?[source,limit,offset]:[limit,offset];
    const sql=source
      ?`SELECT source,source_order_id,customer_email,offer_code,price_cents,currency,status,updated_at FROM salecentar_orders WHERE source=$1 ORDER BY updated_at DESC,source_order_id LIMIT $2 OFFSET $3`
      :`SELECT source,source_order_id,customer_email,offer_code,price_cents,currency,status,updated_at FROM salecentar_orders ORDER BY updated_at DESC,source_order_id LIMIT $1 OFFSET $2`;
    const [orders,summary]=await Promise.all([
     pool.query(sql,args),
     pool.query(`SELECT source,status,currency,COUNT(*)::integer AS count,COALESCE(SUM(price_cents),0)::text AS total_cents FROM salecentar_orders GROUP BY source,status,currency ORDER BY source,status`)
    ]);
    return respond(res,200,{orders:orders.rows,offset,limit,summary:summary.rows});
   }
   if(req.method==='GET'&&url.pathname==='/admin/overview'){
    const [summary,totals,events]=await Promise.all([
     pool.query(`SELECT source,status,currency,COUNT(*)::integer AS count,COALESCE(SUM(price_cents),0)::text AS total_cents FROM salecentar_orders GROUP BY source,status,currency ORDER BY source,status,currency`),
     pool.query(`SELECT COUNT(*)::integer AS total_orders, COUNT(*) FILTER (WHERE status='pending')::integer AS pending_orders, COUNT(*) FILTER (WHERE status='paid')::integer AS paid_orders FROM salecentar_orders`),
     pool.query(`SELECT source,source_order_id,old_status,new_status,reference,actor,created_at FROM salecentar_payment_events ORDER BY created_at DESC LIMIT 25`)
    ]);
    return respond(res,200,{summary:summary.rows,totals:totals.rows[0],recentPaymentEvents:events.rows});
   }
   if(req.method==='POST'&&url.pathname==='/admin/payments/verify'){
    const input=JSON.parse((await read(req)).toString('utf8'));
    if(!Object.hasOwn(keys,input?.source)||typeof input?.order_id!=='string'||
       !/^[0-9a-f-]{36}$/i.test(input.order_id)||!['paid','cancelled','refunded'].includes(input.status)||
       typeof input.reference!=='string'||input.reference.trim().length<8||input.reference.length>200)
     return respond(res,400,{error:'Invalid payment verification'});
    const client=await pool.connect();
    try{
     await client.query('BEGIN');
     const q=await client.query(`SELECT status FROM salecentar_orders WHERE source=$1 AND source_order_id=$2 FOR UPDATE`,[input.source,input.order_id]);
     if(!q.rowCount||!allowedTransition(q.rows[0].status,input.status)){
      await client.query('ROLLBACK');return respond(res,409,{error:'Invalid status transition'});
     }
     await client.query(`UPDATE salecentar_orders SET status=$1,external_payment_reference=$2,updated_at=now() WHERE source=$3 AND source_order_id=$4`,
      [input.status,input.reference.trim(),input.source,input.order_id]);
     await client.query(`INSERT INTO salecentar_payment_events(id,source,source_order_id,old_status,new_status,reference,actor)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [randomUUID(),input.source,input.order_id,q.rows[0].status,input.status,input.reference.trim(),'pilot-admin']);
     await client.query('COMMIT');
     return respond(res,200,{ok:true,status:input.status});
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
   }
  }
  return respond(res,404,{error:'Not found'});
 }catch(e){console.error('SaleCentar integration error:',e.message);return respond(res,e.message==='Payload too large'?413:400,{error:'Request could not be processed'});}
});
server.listen(Number(process.env.SALECENTAR_PORT)||3101,process.env.SALECENTAR_HOST||'127.0.0.1',()=>console.log('We Do Care Global SaleCentar integration started'));
