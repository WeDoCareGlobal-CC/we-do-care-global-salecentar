import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Vercel exposes only read-only frontend; backend remains excluded', async () => {
  const c = JSON.parse(await read('vercel.json'));
  assert.deepEqual(Object.keys(c.services), ['salecentar-preview']);
  assert.deepEqual(c.rewrites, [
    {source:'/(.*)',destination:{service:'salecentar-preview'}}
  ]);
  assert.equal(c.services['salecentar-preview'].root, 'apps/salecentar');
  assert.match(c.services['salecentar-preview'].buildCommand, /VITE_SALECENTAR_PREVIEW_ONLY=1/);
  assert.match(c.services['salecentar-preview'].buildCommand, /build:v2/);
  for (const service of Object.values(c.services)) {
    assert.ok(!String(service.root).includes('integration'), 'integration backend not deployable yet');
    assert.ok(!service.bindings?.length, 'no internal service bindings until authorization design reviewed');
  }
});

test('Legacy integration server is not a Vercel Function entrypoint', async () => {
  const source = await read('apps/salecentar/integration/server.mjs');
  assert.match(source, /export const handleRequest=async/);
  assert.ok(source.includes('fileURLToPath(import.meta.url)'));
  assert.match(source, /await runMigrations/);
  const migrations = await read('apps/salecentar/integration/migrations.mjs');
  assert.match(migrations, /export async function runMigrations/);
  assert.match(migrations, /CREATE TABLE IF NOT EXISTS salecentar_orders/);
  assert.ok(!source.includes('await pool.query(`CREATE TABLE'), 'DDL never runs during handler import');
  assert.ok(!JSON.parse(await read('vercel.json')).services.integration);
});
