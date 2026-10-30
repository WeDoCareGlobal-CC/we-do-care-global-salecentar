import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const here = new URL('.', import.meta.url);
const read = name => readFile(new URL(name, here), 'utf8');

test('manual entitlement writes record manual provenance', async () => {
  const server = await read('server.mjs');
  assert.match(server, /INSERT INTO sc_module_entitlements\(user_id,module_id,enabled,provisioning_source\)/);
  assert.match(server, /DO UPDATE SET enabled=excluded\.enabled,provisioning_source='manual'/);
});

test('provenance migration is unconditional and runs before webhook schema', async () => {
  const server = await read('server.mjs');
  const migrate = server.indexOf("await pool.query(\`ALTER TABLE sc_module_entitlements ADD COLUMN IF NOT EXISTS provisioning_source");
  const webhook = server.indexOf('if(shopifyWebhookSecret) {');
  assert(migrate > 0 && webhook > migrate, 'Provenance column must exist even when Shopify disabled');
});

test('Shopify cannot overwrite manually disabled access', async () => {
  const grant = await read('shopify-grant-tx.mjs');
  assert.match(grant, /WHERE sc_module_entitlements\.provisioning_source='shopify'/);
  assert.doesNotMatch(grant, /OR sc_module_entitlements\.enabled=false/);
});

test('refund revocation filters only Shopify-owned entitlements', async () => {
  const revoke = await read('shopify-revoke-tx.mjs');
  assert.match(revoke, /AND provisioning_source='shopify'/);
});
