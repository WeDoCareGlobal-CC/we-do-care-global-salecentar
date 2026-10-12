import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';

const db=process.env.SALECENTAR_TEST_DATABASE_URL;
if(process.env.SALECENTAR_REQUIRE_DB_TESTS==='true'&&!db) throw Error('PostgreSQL tests required but SALECENTAR_TEST_DATABASE_URL missing');
test('PostgreSQL: central login, module introspection, role enforcement, and revocation',async()=>{
 const {default:pg}=await import('pg');
 const menuSecret='m'.repeat(40),zeroSecret='z'.repeat(40),admin='a'.repeat(40);
 const port=32001;
 const child=spawn(process.execPath,['server.mjs'],{
  cwd:new URL('.',import.meta.url),
  env:{...process.env,SALECENTAR_DATABASE_URL:db,SALECENTAR_MENU_SNAP_SECRET:menuSecret,
   SALECENTAR_ZERO_BUDGET_SECRET:zeroSecret,SALECENTAR_ADMIN_TOKEN:admin,
   SALECENTAR_ALLOW_LEGACY_ADMIN:'true',SALECENTAR_PORT:String(port)},stdio:'pipe'
 });
 const base=`http://127.0.0.1:${port}`;
 const email=`integration-${randomUUID()}@example.org`,password='Unique-Integration-Password-2026!';
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
 const introspect=(token,module,secret)=>post('/internal/auth/introspect',{token},{
  'x-salecentar-module':module,'x-salecentar-service-key':secret});
 try{
  await wait();
  const created=await post('/admin/users',{email,password,role:'viewer'},
   {authorization:`Bearer ${admin}`});
  assert.equal(created.status,201);
  const wrong=await post('/auth/login',{email,password:'incorrect'});
  assert.equal(wrong.status,401);
  const login=await post('/auth/login',{email,password});
  assert.equal(login.status,200);
  const {token}=await login.json();
  assert.ok(token?.length>=32);
  assert.equal((await introspect(token,'menu-snap',zeroSecret)).status,401);
  assert.equal((await introspect(token,'unknown',menuSecret)).status,401);
  const valid=await introspect(token,'menu-snap',menuSecret);
  assert.equal(valid.status,200);
  const body=await valid.json();
  assert.equal(body.user.email,email);
  assert.equal(body.user.role,'viewer');
  assert.equal(body.token,undefined);
  assert.equal((await introspect(token,'zerobudget-ai',zeroSecret)).status,200);
  assert.equal((await post('/admin/users',{email:'new@example.org',password,role:'admin'},
   {authorization:`Bearer ${token}`})).status,401);
  assert.equal((await fetch(base+'/auth/logout',{method:'POST',
   headers:{authorization:`Bearer ${token}`}})).status,200);
  assert.equal((await introspect(token,'menu-snap',menuSecret)).status,401);
 }finally{
  child.kill('SIGTERM');
  const pool=new pg.Pool({connectionString:db});
  await pool.query('DELETE FROM sc_users WHERE email=$1',[email]);
  await pool.end();
 }
});
