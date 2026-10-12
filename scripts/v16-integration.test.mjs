import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Muse Flow speech route requires central auth',()=>{
 const server=read('apps/muse-flow/server.ts');
 assert.match(server,/app\.post\('\/api\/integrations\/speech',requireCentralSession,speechBridge\)/);
});
test('bridge forwards central bearer and validates audio',()=>{
 const bridge=read('apps/muse-flow/server/speechBridge.ts');
 assert.match(bridge,/authorization:token/);
 assert.match(bridge,/audio\/mpeg/);
 assert.match(bridge,/10_000_000/);
 assert.match(bridge,/controller\.abort/);
});
test('UI uses authenticated fetch and creates audio download',()=>{
 const ui=read('apps/muse-flow/src/App.tsx');
 assert.match(ui,/authenticatedFetch\('\/api\/integrations\/speech'/);
 assert.match(ui,/muse-flow-speech\.mp3/);
});
test('bridge config is documented',()=>{
 assert.match(read('apps/muse-flow/.env.example'),/SPEECH_GENERATOR_URL=/);
});
