import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCookies,sessionCookies,clearSessionCookies,createSessionToken,createCsrfToken,resolveV2Session,validCsrf,validSameOrigin} from './v2-session.mjs';

test('session cookie is secure and httpOnly', () => {
  const cookie=sessionCookies(createSessionToken(),createCsrfToken())[0];
  assert.match(cookie,/HttpOnly/);
  assert.match(cookie,/Secure/);
  assert.match(cookie,/SameSite=Strict/);
  assert.throws(()=>sessionCookies('x','y',{secure:false}));
});
test('CSRF double-submit validation', () => {
  const token=createCsrfToken();
  assert.equal(validCsrf('sc_v2_csrf='+token,token),true);
  assert.equal(validCsrf('sc_v2_csrf='+token,createCsrfToken()),false);
  assert.equal(validCsrf('',token),false);
});
test('session resolver rejects missing and malformed tokens',async()=>{
  const pool={query:()=>{throw Error('must not query')}};
  assert.equal(await resolveV2Session(pool,''),null);
  assert.equal(await resolveV2Session(pool,'sc_v2_session=bad'),null);
});
test('session resolver looks up hashed token',async()=>{
  const token=createSessionToken();
  const user={id:'test',email:'admin@example.org',role:'admin'};
  const pool={query:async(sql,args)=>{assert.match(sql,/sc_sessions/);assert.notEqual(args[0],token);return {rows:[user]}}};
  assert.deepEqual(await resolveV2Session(pool,'sc_v2_session='+token),user);
});
test('strict same-origin comparison',()=>{
  assert.equal(validSameOrigin({headers:{origin:'https://staging.example.org'}},'https://staging.example.org'),true);
  assert.equal(validSameOrigin({headers:{origin:'https://evil.example.org'}},'https://staging.example.org'),false);
  assert.equal(validSameOrigin({headers:{}},'https://staging.example.org'),false);
});
test('logout clears both cookies',()=>assert.equal(clearSessionCookies().length,2));
test('cookie parser does not misread equals',()=>assert.equal(parseCookies('a=x=y; b=z').get('a'),'x=y'));
