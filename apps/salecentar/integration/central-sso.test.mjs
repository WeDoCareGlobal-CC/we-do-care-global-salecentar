import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./server.mjs',import.meta.url),'utf8');
test('central introspection is protected by module credentials',()=>{
 assert.match(source,/\/internal\/auth\/introspect/);
 assert.match(source,/x-salecentar-module/);
 assert.match(source,/x-salecentar-service-key/);
 assert.match(source,/sc_sessions s/);
 assert.match(source,/u\.active=true/);
});
test('introspection returns no raw bearer token',()=>{
 const section=source.split("url.pathname==='/internal/auth/introspect'")[1].split("url.pathname==='/auth/logout'")[0];
 assert.match(section,/hashToken\(token\)/);
 assert.match(section,/active:true,user:q\.rows\[0\]/);
});
