import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';

const db=process.env.SALECENTAR_TEST_DATABASE_URL;
if(process.env.SALECENTAR_REQUIRE_DB_TESTS==='true'&&!db) throw Error('PostgreSQL tests required but SALECENTAR_TEST_DATABASE_URL missing');

test('PostgreSQL: admin user deletion is transactional, role-gated and protects admin accounts',async()=>{
 const {default:pg}=await import('pg');
 const menuSecret='m'.repeat(40),zeroSecret='z'.repeat(40),admin='a'.repeat(40);
 const port=32020;
 const child=spawn(process.execPath,['server.mjs'],{
  cwd:new URL('.',import.meta.url),
  env:{...process.env,SALECENTAR_DATABASE_URL:db,SALECENTAR_MENU_SNAP_SECRET:menuSecret,
   SALECENTAR_ZERO_BUDGET_SECRET:zeroSecret,SALECENTAR_ADMIN_TOKEN:admin,
   SALECENTAR_ALLOW_LEGACY_ADMIN:'true',SALECENTAR_PORT:String(port)},stdio:'pipe'
 });
 const base=`http://127.0.0.1:${port}`;
 const password='Unique-Deletion-Password-2026!';
 const viewerEmail=`del-viewer-${randomUUID()}@example.org`;
 const adminEmail=`del-admin-${randomUUID()}@example.org`;
 const wait=async()=>{
  for(let i=0;i<80;i++){
   if(child.exitCode!==null)throw Error('central service exited');
   try{if((await fetch(base+'/health')).ok)return;}catch{}
   await new Promise(r=>setTimeout(r,100));
  }
  throw Error('central service timeout');
 };
 const post=(path,data,headers={})=>fetch(base+path,{method:'POST',
  headers:{'content-type':'application/json',...headers},body:JSON.stringify(data)});
 const del=(path,headers={})=>fetch(base+path,{method:'DELETE',headers});
 const adminHeaders={authorization:`Bearer ${admin}`};
 const pool=new pg.Pool({connectionString:db});
 const cleanup=async()=>{
  await pool.query(`DELETE FROM sc_module_entitlements WHERE user_id IN
   (SELECT id FROM sc_users WHERE email LIKE 'del-%@example.org')`);
  await pool.query(`DELETE FROM sc_sessions WHERE user_id IN
   (SELECT id FROM sc_users WHERE email LIKE 'del-%@example.org')`);
  await pool.query(`DELETE FROM sc_users WHERE email LIKE 'del-%@example.org'`);
 };
 try{
  await wait();

  // --- setup: viewer and admin accounts ---
  assert.equal((await post('/admin/users',{email:viewerEmail,password,role:'viewer'},adminHeaders)).status,201);
  assert.equal((await post('/admin/users',{email:adminEmail,password,role:'admin'},adminHeaders)).status,201);
  const idOf=async(email)=>(await pool.query('SELECT id FROM sc_users WHERE email=$1',[email])).rows[0]?.id;
  const existsById=async(id)=>!!(await pool.query('SELECT id FROM sc_users WHERE id=$1',[id])).rowCount;
  const viewerId=await idOf(viewerEmail),adminId=await idOf(adminEmail);
  assert.ok(viewerId&&adminId,'both accounts exist');

  // --- 1. viewer session cannot delete users (role enforcement) ---
  const login=await post('/auth/login',{email:viewerEmail,password});
  assert.equal(login.status,200);
  const viewerToken=(await login.json()).token;
  const viewerDelete=await del(`/admin/users/${adminId}`,{authorization:`Bearer ${viewerToken}`});
  assert.equal(viewerDelete.status,401,'viewer session rejected with 401');
  assert.ok(await existsById(adminId),'target admin still exists after viewer attempt');

  // --- 2. unauthenticated request rejected ---
  assert.equal((await del(`/admin/users/${viewerId}`)).status,401,'no token rejected');
  assert.equal((await del(`/admin/users/${viewerId}`,{authorization:'Bearer short'})).status,401,'malformed token rejected');

  // --- 3. admin cannot delete another administrator (protected account) ---
  const adminDelete=await del(`/admin/users/${adminId}`,adminHeaders);
  assert.equal(adminDelete.status,403,'protected admin account returns 403');
  assert.ok(await existsById(adminId),'admin account survives deletion attempt');

  // --- 4. admin deletes the viewer: full cascade, no partial rows left ---
  await pool.query(`INSERT INTO sc_module_entitlements(user_id,module_id,enabled)
   VALUES($1,'menu-snap',true)`,[viewerId]);
  await pool.query(`INSERT INTO sc_sessions(token_hash,user_id,expires_at)
   VALUES($1,$2,now()+interval '1 hour')`,[randomUUID().replace(/-/g,''),viewerId]);
  const okDelete=await del(`/admin/users/${viewerId}`,adminHeaders);
  assert.equal(okDelete.status,200,'admin deletes viewer');
  assert.equal(await existsById(viewerId),false,'user row removed');
  assert.equal((await pool.query('SELECT count(*)::int c FROM sc_sessions WHERE user_id=$1',[viewerId])).rows[0].c,0,'sessions removed');
  assert.equal((await pool.query('SELECT count(*)::int c FROM sc_module_entitlements WHERE user_id=$1',[viewerId])).rows[0].c,0,'entitlements removed');

  // --- 5. deleting a nonexistent user is a clean 404, not a crash ---
  const missing=await del(`/admin/users/${randomUUID()}`,adminHeaders);
  assert.equal(missing.status,404,'unknown user returns 404');

  // --- 6. invalid id shape rejected before touching the database ---
  assert.equal((await del('/admin/users/not-a-uuid',adminHeaders)).status,400);
 }finally{
  child.kill('SIGTERM');
  await cleanup().catch(()=>{});
  await pool.end();
 }
});
