import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {checkRelease} from './release-gate.mjs';
test('release gate requires all five modules, CI DB tests and runbooks',()=>{
 assert.deepEqual(checkRelease(resolve(import.meta.dirname,'..')),[]);
});
test('release gate rejects missing project',()=>{
 assert.throws(()=>checkRelease('/nonexistent-project'));
});
