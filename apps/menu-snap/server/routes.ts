import {centralIdentity,centralLogin,checkCentralEntitlement} from '../centralAuth';
import type { Express, Request, Response, NextFunction } from 'express';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pool, digest, hashPassword, verifyPassword } from './db';
type Actor={id:string;email:string;role:string};
declare global { namespace Express { interface Request { actor?: Actor } } }
const limit = Math.max(1, Math.min(100, Number(process.env.AI_DAILY_LIMIT)||30));
const dir=path.resolve(process.env.IMAGE_STORAGE_DIR||'./private-images');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe=(fn:(req:Request,res:Response)=>Promise<any>)=>(req:Request,res:Response,next:NextFunction)=>Promise.resolve(fn(req,res)).catch(next);
const auth=async(req:Request,res:Response,next:NextFunction)=>{
 try {
  const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
  if(!token){res.status(401).json({error:'Login required'});return;}
  if(process.env.SALECENTAR_AUTH_URL){
    const identity=await centralIdentity(token,'menu-snap');
    if(!identity){res.status(401).json({error:'Central session invalid'});return;}
    // Keep local FK ownership and quota accounting while SaleCentar owns credentials.
    const found=await pool.query('SELECT id,role FROM app_users WHERE email=$1',[identity.email.toLowerCase()]);
    if(!found.rowCount){
      await pool.query(`INSERT INTO app_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)
        ON CONFLICT(email) DO NOTHING`,[identity.id,identity.email.toLowerCase(),'central-managed-no-local-password',identity.role]);
    }
    const account=await pool.query('SELECT id FROM app_users WHERE email=$1',[identity.email.toLowerCase()]);
    req.actor={id:account.rows[0].id,email:identity.email,role:identity.role};
    next();return;
  }
  const q=await pool.query('SELECT u.id,u.email,u.role FROM app_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[digest(token)]);
  if(!q.rowCount){res.status(401).json({error:'Session expired'});return;}
  req.actor=q.rows[0];next();
 }catch(e){next(e);}
};
function requireActor(req:Request,res:Response,next:NextFunction){if(!req.actor){res.status(401).json({error:'Login required'});return;}next();}
function admin(req:Request,res:Response,next:NextFunction){if(req.actor?.role!=='admin'){res.status(403).json({error:'Admin only'});return;}next();}

// Entitlement check middleware: verifies user has grant for 'menu-snap' module
export async function requireEntitlement(req:Request,res:Response,next:NextFunction){
 try {
  if(!process.env.SALECENTAR_AUTH_URL){next();return;}
  const user=req.actor;
  if(!user){res.status(401).json({error:'Login required'});return;}
  const hasEntitlement=await checkCentralEntitlement(user.id,'menu-snap');
  if(!hasEntitlement){res.status(403).json({error:'Module access not granted'});return;}
  next();
 }catch(e){res.status(503).json({error:'Entitlement check unavailable'});}
}

export async function aiQuota(req:Request,res:Response,next:NextFunction){
 try {
  const user=req.actor;
  if(!user){res.status(401).json({error:'Login required'});return;}
  const q=await pool.query(`INSERT INTO ai_usage(user_id,day,used) VALUES($1,CURRENT_DATE,1)
   ON CONFLICT(user_id,day) DO UPDATE SET used=ai_usage.used+1 WHERE ai_usage.used<$2 RETURNING used`,[user.id,limit]);
  if(!q.rowCount){res.status(429).json({error:'Daily AI quota reached'});return;}
  await pool.query('INSERT INTO usage_events(id,user_id,operation,status) VALUES($1,$2,$3,$4)',[randomUUID(),user.id,req.path,'requested']);
  next();
 }catch(nextError){next(nextError);}
}
const loginAttempts=new Map<string,{count:number;until:number}>();
export function installRoutes(app:Express){
 // Auth applies to all /api routes except health, login, and one-time bootstrap.
 app.post('/api/auth/bootstrap',safe(async(req,res)=>{
  if(process.env.SALECENTAR_AUTH_URL)return res.status(403).json({error:'Use SaleCentar central bootstrap'});
  const {email,password,bootstrapKey}=req.body||{};
  if(typeof bootstrapKey!=='string'||bootstrapKey!==process.env.ADMIN_BOOTSTRAP_KEY||bootstrapKey.length<32){res.status(403).json({error:'Invalid bootstrap key'});return;}
  if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<12){res.status(400).json({error:'Valid email and 12+ character password required'});return;}
  const client=await pool.connect();
  try{await client.query('BEGIN');await client.query('LOCK TABLE app_users IN EXCLUSIVE MODE');
   const count=await client.query('SELECT 1 FROM app_users LIMIT 1');
   if(count.rowCount){await client.query('ROLLBACK');res.status(409).json({error:'Bootstrap already completed'});return;}
   await client.query('INSERT INTO app_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)',[randomUUID(),email.toLowerCase(),hashPassword(password),'admin']);
   await client.query('COMMIT');res.status(201).json({ok:true});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }));
 app.post('/api/auth/login',safe(async(req,res)=>{
  const {email,password}=req.body||{};
  if(process.env.SALECENTAR_AUTH_URL){
   if(typeof email!=='string'||typeof password!=='string')return res.status(400).json({error:'Invalid credentials'});
   const session=await centralLogin(email,password);
   if(!session)return res.status(401).json({error:'Invalid credentials'});
   res.setHeader('Cache-Control','no-store');
   return res.json({token:session.token,user:{email,role:session.role}});
  }
  const ip=req.socket.remoteAddress||'unknown';
  const attempt=loginAttempts.get(ip);
  if(attempt && attempt.until>Date.now() && attempt.count>=10){res.status(429).json({error:'Too many login attempts'});return;}
  if(!attempt || attempt.until<Date.now())loginAttempts.set(ip,{count:0,until:Date.now()+15*60_000});
  if(typeof email!=='string'||typeof password!=='string'){res.status(400).json({error:'Invalid credentials'});return;}
  const q=await pool.query('SELECT id,email,password_hash,role FROM app_users WHERE email=$1',[email.toLowerCase()]);
  if(!q.rowCount||!verifyPassword(password,q.rows[0].password_hash)){loginAttempts.get(ip)!.count++;res.status(401).json({error:'Invalid credentials'});return;}
  loginAttempts.delete(ip);
  const token=randomBytes(32).toString('base64url');
  await pool.query("INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",[digest(token),q.rows[0].id]);
  res.setHeader('Cache-Control','no-store');res.json({token,user:{email:q.rows[0].email,role:q.rows[0].role}});
 }));
 app.use('/api',auth,requireActor);
app.use(['/api/menus','/api/orders'],requireEntitlement);
 app.post('/api/auth/logout',safe(async(req,res)=>{
  const token=req.headers.authorization?.slice(7)||'';
  if(process.env.SALECENTAR_AUTH_URL){
   const upstream=await fetch(new URL('/auth/logout',process.env.SALECENTAR_AUTH_URL),{
    method:'POST',headers:{authorization:`Bearer ${token}`}
   });
   if(!upstream.ok)return res.status(503).json({error:'Central logout unavailable'});
   return res.json({ok:true});
  }
  await pool.query('DELETE FROM app_sessions WHERE token_hash=$1',[digest(token)]);res.json({ok:true});
 }));
 app.get('/api/auth/me',(req,res)=>res.json({user:req.actor}));
 app.post('/api/admin/users',admin,safe(async(req,res)=>{
  const {email,password}=req.body||{};
  if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<12){res.status(400).json({error:'Valid email and password (12+ chars) required'});return;}
  await pool.query('INSERT INTO app_users(id,email,password_hash) VALUES($1,$2,$3)',[randomUUID(),email.toLowerCase(),hashPassword(password)]);
  res.status(201).json({ok:true});
 }));
 app.get('/api/menus',safe(async(req,res)=>{
  const q=await pool.query('SELECT id,payload,approved,updated_at FROM menus WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100',[req.actor!.id]);
  res.json({menus:q.rows});
 }));
 app.post('/api/menus',safe(async(req,res)=>{
  const payload=req.body?.menu;
  if(!validMenu(payload)){res.status(400).json({error:'Invalid menu'});return;}
  const id=randomUUID();await pool.query('INSERT INTO menus(id,user_id,payload) VALUES($1,$2,$3)',[id,req.actor!.id,payload]);res.status(201).json({id});
 }));
 app.get('/api/menus/:id',safe(async(req,res)=>{
  if(!uuid.test(req.params.id)){res.status(400).json({error:'Invalid ID'});return;}
  const q=await pool.query('SELECT id,payload,approved FROM menus WHERE id=$1 AND user_id=$2',[req.params.id,req.actor!.id]);
  if(!q.rowCount){res.status(404).json({error:'Not found'});return;}res.json(q.rows[0]);
 }));
 app.patch('/api/menus/:id',safe(async(req,res)=>{
  if(!uuid.test(req.params.id)||!validMenu(req.body?.menu)){res.status(400).json({error:'Invalid menu or ID'});return;}
  const q=await pool.query('UPDATE menus SET payload=$1,approved=false,updated_at=now() WHERE id=$2 AND user_id=$3 RETURNING id',[req.body.menu,req.params.id,req.actor!.id]);
  if(!q.rowCount){res.status(404).json({error:'Not found'});return;}res.json({ok:true});
 }));
 app.post('/api/menus/:id/approve',safe(async(req,res)=>{
  if(!uuid.test(req.params.id)){res.status(400).json({error:'Invalid ID'});return;}
  const q=await pool.query('UPDATE menus SET approved=true WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,req.actor!.id]);
  if(!q.rowCount){res.status(404).json({error:'Not found'});return;}res.json({ok:true});
 }));
 app.get('/api/menus/:id/export',safe(async(req,res)=>{
  if(!uuid.test(req.params.id)){res.status(400).json({error:'Invalid ID'});return;}
  const q=await pool.query('SELECT payload FROM menus WHERE id=$1 AND user_id=$2 AND approved=true',[req.params.id,req.actor!.id]);
  if(!q.rowCount){res.status(404).json({error:'Approved menu not found'});return;}
  res.setHeader('Content-Disposition','attachment; filename="menu.json"');res.json(q.rows[0].payload);
 }));
 app.post('/api/images',safe(async(req,res)=>{
  const {dataUrl}=req.body||{};
  if(typeof dataUrl!=='string'||dataUrl.length>9_000_000){res.status(400).json({error:'Invalid image'});return;}
  const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if(!match){res.status(400).json({error:'PNG/JPEG/WEBP base64 required'});return;}
  const data=Buffer.from(match[2],'base64');
  const validSignature=match[1]==='image/png'?data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))
    :match[1]==='image/jpeg'?data.subarray(0,3).equals(Buffer.from('ffd8ff','hex'))
    :data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP';
  if(!validSignature){res.status(400).json({error:'Image format does not match content'});return;}
  if(!data.length||data.length>6_000_000){res.status(413).json({error:'Image too large'});return;}
  const id=randomUUID();await fs.mkdir(dir,{recursive:true,mode:0o700});const location=path.join(dir,id);
  await fs.writeFile(location,data,{flag:'wx',mode:0o600});
  try{await pool.query('INSERT INTO images(id,user_id,mime,file_path) VALUES($1,$2,$3,$4)',[id,req.actor!.id,match[1],location]);}
  catch(e){await fs.unlink(location);throw e;}
  res.status(201).json({id,url:`/api/images/${id}`});
 }));
 app.get('/api/images/:id',safe(async(req,res)=>{
  if(!uuid.test(req.params.id)){res.status(400).json({error:'Invalid ID'});return;}
  const q=await pool.query('SELECT mime,file_path FROM images WHERE id=$1 AND user_id=$2',[req.params.id,req.actor!.id]);
  if(!q.rowCount){res.status(404).json({error:'Not found'});return;}
  res.type(q.rows[0].mime);res.setHeader('Cache-Control','private, no-store');res.send(await fs.readFile(q.rows[0].file_path));
 }));
 // Pilot orders are intentionally not payment processing. Admin must independently verify bank/provider receipt.
 app.post('/api/orders',safe(async(req,res)=>{
  const {menuId,offerCode}=req.body||{};
  if(!uuid.test(menuId)||offerCode!=='MENU_SNAP_STARTER'){res.status(400).json({error:'Invalid order'});return;}
  const m=await pool.query('SELECT id FROM menus WHERE id=$1 AND user_id=$2',[menuId,req.actor!.id]);
  if(!m.rowCount){res.status(404).json({error:'Menu not found'});return;}
  const price=Number(process.env.MENU_SNAP_PRICE_CENTS);
  if(!Number.isInteger(price)||price<100){res.status(503).json({error:'Server price not configured'});return;}
  const id=randomUUID();
  await pool.query('INSERT INTO orders(id,user_id,menu_id,offer_code,price_cents) VALUES($1,$2,$3,$4,$5)',[id,req.actor!.id,menuId,offerCode,price]);
  res.status(201).json({id,status:'pending',priceCents:price,currency:'EUR'});
 }));
 app.get('/api/orders',safe(async(req,res)=>{
  const q=await pool.query('SELECT id,menu_id,offer_code,price_cents,currency,status,created_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[req.actor!.id]);
  res.json({orders:q.rows});
 }));
 app.post('/api/admin/orders/:id/verify',admin,safe(async(req,res)=>{
  const {externalReference}=req.body||{};
  if(!uuid.test(req.params.id)||typeof externalReference!=='string'||externalReference.trim().length<8||externalReference.length>150){res.status(400).json({error:'Independent payment reference required'});return;}
  const q=await pool.query(`UPDATE orders SET status='paid',external_payment_reference=$1,verified_by=$2,verified_at=now()
   WHERE id=$3 AND status='pending' RETURNING id`,[externalReference.trim(),req.actor!.id,req.params.id]);
  if(!q.rowCount){res.status(409).json({error:'Order not pending'});return;}res.json({ok:true,status:'paid'});
 }));
 app.post('/api/admin/salecentar-sync',admin,safe(async(req,res)=>{
  const target=process.env.SALECENTAR_SYNC_URL;
  const secret=process.env.SALECENTAR_MENU_SNAP_SECRET;
  if(!target||!secret||secret.length<32){res.status(503).json({error:'SaleCentar sync not configured'});return;}
  const url=new URL(target);
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))){res.status(400).json({error:'Sync target must use HTTPS'});return;}
  const q=await pool.query(`SELECT o.id AS order_id,u.email AS customer_email,o.offer_code,o.price_cents,o.currency,o.status,o.external_payment_reference,o.verified_at,o.created_at
    FROM orders o JOIN app_users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 1000`);
  const body=JSON.stringify({format:'salecentar-pilot-v1',orders:q.rows});
  const timestamp=String(Date.now());
  const signature='sha256='+createHmac('sha256',secret).update(timestamp+'.'+body).digest('hex');
  const response=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json','X-WDC-Signature':signature,'X-WDC-Timestamp':timestamp},body,signal:AbortSignal.timeout(12000)});
  if(!response.ok){res.status(502).json({error:'SaleCentar sync rejected request'});return;}
  res.json({ok:true,sent:q.rows.length});
 }));
 app.get('/api/admin/salecentar-export',admin,safe(async(req,res)=>{
  const q=await pool.query(`SELECT o.id AS order_id,u.email AS customer_email,o.offer_code,o.price_cents,o.currency,o.status,o.external_payment_reference,o.verified_at,o.created_at
    FROM orders o JOIN app_users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 1000`);
  res.setHeader('Cache-Control','no-store');res.json({format:'salecentar-pilot-v1',orders:q.rows});
 }));
}
function validMenu(x:any):boolean {
 return x&&typeof x==='object'&&typeof x.restaurantName==='string'&&x.restaurantName.length<=160
  &&Array.isArray(x.dishes)&&x.dishes.length<=100&&x.dishes.every((d:any)=>d&&typeof d.name==='string'&&d.name.length>0&&d.name.length<=160)
  &&JSON.stringify(x).length<=250_000 && x.dishes.every((d:any)=>!d.generatedImageUrl || (typeof d.generatedImageUrl==='string' && /^\/api\/images\/[0-9a-f-]{36}$/i.test(d.generatedImageUrl)));
}
