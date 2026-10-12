import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('release audit validates all five modules and CI',()=>{
 const p=spawnSync(process.execPath,['scripts/release-audit.mjs'],{encoding:'utf8'});
 assert.equal(p.status,0,p.stdout+' '+p.stderr);
 const report=JSON.parse(p.stdout);
 assert.equal(report.ok,true);
 assert.deepEqual(report.issues,[]);
});
