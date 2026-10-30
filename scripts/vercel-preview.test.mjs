import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Vercel staging exposes only SaleCentar read-only preview', async () => {
  const config = JSON.parse(await read('vercel.json'));
  assert.deepEqual(Object.keys(config.services), ['salecentar-preview']);
  assert.equal(config.services['salecentar-preview'].root, 'apps/salecentar');
  assert.match(config.services['salecentar-preview'].buildCommand, /VITE_SALECENTAR_PREVIEW_ONLY=1/);
  assert.match(config.services['salecentar-preview'].buildCommand, /build:v2/);
  assert.equal(config.services['salecentar-preview'].outputDirectory, 'dist-v2');
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: { service: 'salecentar-preview' } }]);
  assert.ok(!Object.hasOwn(config.services, 'integration'), 'no public or internal Shopify backend build');
});

test('Vercel preview bypasses API session call and disables login form', async () => {
  const app = await read('apps/salecentar/src/AppV2.tsx');
  assert.match(app, /if \(previewOnly\) \{ setLoading\(false\); return; \}/);
  assert.match(app, /if \(previewOnly\) return <main/);
  assert.match(app, /Sign-in, purchases, Shopify webhooks, and license delivery are disabled/);
});
