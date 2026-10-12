import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
test('Menu Snap production server uses ESM output',()=>{
 const p=read('../../menu-snap/package.json');
 assert.match(p.scripts.build,/--format=esm/);
 assert.match(p.scripts.start,/dist\/server\.mjs/);
 assert.match(p.scripts.start,/NODE_ENV=production/);
});
test('ZeroBudget AI production server uses ESM output',()=>{
 const p=read('../../zerobudget-ai/package.json');
 assert.match(p.scripts.build,/--format=esm/);
 assert.match(p.scripts.start,/dist\/server\.mjs/);
 assert.match(p.scripts.start,/NODE_ENV=production/);
});
