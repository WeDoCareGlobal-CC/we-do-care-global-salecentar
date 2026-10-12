import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../../',import.meta.url);
const file=p=>readFileSync(new URL(p,root),'utf8');
test('Muse-Flow API is gated by central authentication',()=>{
 const s=file('apps/muse-flow/server.ts');
 assert.match(s,/app\.use\('\/api',requireCentralSession,apiRouter\)/);
 assert.match(s,/app\.post\('\/api\/auth\/login'/);
});
test('Muse-Flow Vite development does not bypass central auth',()=>{
 const s=file('apps/muse-flow/vite.config.ts');
 assert.doesNotMatch(s,/apiServerPlugin|app\.use\('\/api', apiRouter\)/);
});
test('Muse-Flow client requests include bearer token',()=>{
 const s=file('apps/muse-flow/src/services/api.ts');
 assert.doesNotMatch(s,/await fetch\("\/api\//);
 assert.match(s,/authenticatedFetch/);
});
test('SaleCentar introspection recognizes separate Muse-Flow service secret',()=>{
 const s=file('apps/salecentar/integration/server.mjs');
 assert.match(s,/SALECENTAR_MUSE_FLOW_SECRET/);
 assert.match(s,/moduleName==='muse-flow'\?museAuthSecret/);
});
