import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectTemplate,validateRuntime} from './verify-config.mjs';
test('missing environment keys are detected',()=>assert.deepEqual(inspectTemplate('FOO=bar\n# BAR=x',['FOO','BAR']),['BAR']));
test('reject production legacy administrator',()=>assert.match(validateRuntime({NODE_ENV:'production',SALECENTAR_ALLOW_LEGACY_ADMIN:'true'}).join(' '),/Legacy/));
test('reject reused service secrets',()=>assert.match(validateRuntime({SALECENTAR_MENU_SNAP_SECRET:'x'.repeat(40),SALECENTAR_HERMES_SECRET:'x'.repeat(40)}).join(' '),/distinct/));
test('reject short service secrets',()=>assert.match(validateRuntime({SALECENTAR_MUSE_FLOW_SECRET:'short'}).join(' '),/32/));
test('reject public production simulation',()=>assert.match(validateRuntime({NODE_ENV:'production',X402_SETTLE_MODE:'simulate',X402_HOST:'0.0.0.0'}).join(' '),/simulation/));
