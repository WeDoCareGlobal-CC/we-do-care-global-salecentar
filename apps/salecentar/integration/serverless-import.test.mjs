import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('importing handler is side-effect-free without reachable PostgreSQL', () => {
  const directory = fileURLToPath(new URL('.', import.meta.url));
  const cmd = "const { handleRequest } = await import('./server.mjs'); if (typeof handleRequest !== 'function') process.exit(8);";
  const result = spawnSync(process.execPath,['--input-type=module','-e',cmd],{
    cwd: directory,
    timeout: 12000,
    encoding: 'utf8',
    env: {
      ...process.env,
      SALECENTAR_DATABASE_URL: 'postgres://unreachable:unreachable@127.0.0.1:1/unreachable',
      SALECENTAR_MENU_SNAP_SECRET: 'a'.repeat(36),
      SALECENTAR_ZERO_BUDGET_SECRET: 'b'.repeat(36),
      SALECENTAR_SHOPIFY_WEBHOOK_SECRET: '',
      SALECENTAR_ALLOW_LEGACY_ADMIN: 'false',
      PORT: 'not-a-port',
      SALECENTAR_PORT: '3101'
    }
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /integration started|migration completed/);
});
