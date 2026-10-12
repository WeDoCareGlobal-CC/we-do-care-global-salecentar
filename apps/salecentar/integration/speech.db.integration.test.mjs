import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const db=process.env.SALECENTAR_TEST_DATABASE_URL;
if(process.env.SALECENTAR_REQUIRE_DB_TESTS==='true'&&!db)throw Error('PostgreSQL tests required');
test('PostgreSQL: module grant, speech quota, usage and portal visibility',async()=>{
 const {default:pg}=await import('pg');
 const admin='a'.repeat(40),speech='s'.repeat(40),port=32012;
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,SALECENTAR_DATABASE_URL:db,SALECENTAR_MENU_SNAP_SECRET:'m'.repeat(40),SALECENTAR_ZERO_BUDGET_SECRET:'z'.repeat(40),SALECENTAR_SPEECH_GENERATOR_SECRET:speech,SALECENTAR_ADMIN_TOKEN:admin,SALECENTAR_ALLOW_LEGACY_ADMIN:'true',SALECENTAR_PORT:String(port),SPEECH_DAILY_LIMIT:'2'},stdio:'pipe'});
 const base=`http://127.0.0.1:${port}`,email=`speech-${randomUUID()}@example.org`,password='Unique-Speech-Password-2026!';
 const post=(path,data,headers={})=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(data)});
 const svc={'x-salecentar-service-key':speech};
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.equal(ready,true,'server started');
  assert.equal((await post('/admin/users',{email,password,role:'viewer'},{authorization:`Bearer ${admin}`})).status,201);
  const pool=new pg.Pool({connectionString:db});
  let id;
  try{id=(await pool.query('SELECT id FROM sc_users WHERE email=$1',[email])).rows[0].id;}finally{await pool.end();}
  const login=await post('/auth/login',{email,password});assert.equal(login.status,200);
  const {token}=await login.json(),bearer={authorization:`Bearer ${token}`};
  const reserve=()=>post('/internal/speech/usage/reserve',{token,request_id:randomUUID(),characters:5},svc);
  assert.equal((await reserve()).status,403);
  assert.equal((await post('/admin/entitlements',{user_id:id,module_id:'speech-generator',enabled:true},{authorization:`Bearer ${admin}`})).status,200);
  const modules=await fetch(base+'/portal/api/modules',{headers:bearer});
  assert.equal((await modules.json()).modules.find(x=>x.id==='speech-generator').access,true);
  const requestId=randomUUID();
  assert.equal((await post('/internal/speech/usage/reserve',{token,request_id:requestId,characters:5},svc)).status,200);
  assert.equal((await post('/internal/speech/usage/finish',{request_id:requestId,status:'succeeded'},svc)).status,200);
  assert.equal((await post('/internal/speech/usage/finish',{request_id:requestId,status:'succeeded'},svc)).status,409);
  assert.equal((await reserve()).status,200);
  assert.equal((await reserve()).status,429);
  const usage=await fetch(base+'/portal/api/usage',{headers:bearer});
  assert.equal((await usage.json()).speech.reduce((n,x)=>n+x.requests,0),2);
 }finally{
  child.kill('SIGTERM');
  const pool=new (await import('pg')).default.Pool({connectionString:db});
  await pool.query('DELETE FROM sc_users WHERE email=$1',[email]).catch(()=>{});
  await pool.end();
 }
});
