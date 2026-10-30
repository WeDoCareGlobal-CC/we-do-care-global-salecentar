import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './adapters/vercel-node.mjs';

function request(method, url) {
  const response = { status: null, headers: {}, body: '' };
  return handler({ method, url }, {
    writeHead(status, headers) { response.status = status; response.headers = headers; },
    end(body) { response.body = String(body || ''); }
  }).then(() => response);
}

test('Vercel adapter defaults to disabled, including health', async () => {
  const old = process.env.SALECENTAR_VERCEL_API_ENABLED;
  delete process.env.SALECENTAR_VERCEL_API_ENABLED;
  try {
    const r = await request('GET', '/health');
    assert.equal(r.status, 503);
    assert.equal(r.headers['Cache-Control'], 'no-store');
    assert.equal(JSON.parse(r.body).error, 'SaleCentar API staging is disabled');
  } finally {
    if (old === undefined) delete process.env.SALECENTAR_VERCEL_API_ENABLED;
    else process.env.SALECENTAR_VERCEL_API_ENABLED = old;
  }
});

test('enabled adapter blocks risky routes before backend import', async () => {
  const old = process.env.SALECENTAR_VERCEL_API_ENABLED;
  process.env.SALECENTAR_VERCEL_API_ENABLED = 'true';
  try {
    for (const [method, path] of [
      ['POST','/webhooks/shopify'], ['POST','/api/v2/login'],
      ['GET','/api/v2/session'], ['GET','/admin/orders'],
      ['POST','/admin/payments/verify'], ['GET','/internal/auth/introspect'],
      ['POST','/health'], ['GET','/health/'], ['GET','/%61dmin/orders']
    ]) {
      const r = await request(method, path);
      assert.equal(r.status, 404, `${method} ${path}`);
      assert.equal(r.headers['Cache-Control'], 'no-store');
    }
  } finally {
    if (old === undefined) delete process.env.SALECENTAR_VERCEL_API_ENABLED;
    else process.env.SALECENTAR_VERCEL_API_ENABLED = old;
  }
});

test('enabled liveness health never checks database or commerce', async () => {
  const old = process.env.SALECENTAR_VERCEL_API_ENABLED;
  process.env.SALECENTAR_VERCEL_API_ENABLED = 'true';
  try {
    for (const path of ['/health', '/health?probe=1']) {
      const r = await request('GET', path);
      assert.equal(r.status, 200, path);
      assert.equal(r.headers['Cache-Control'], 'no-store');
      assert.deepEqual(JSON.parse(r.body), {
        ok: true,
        component: 'salecentar-vercel-adapter',
        check: 'liveness-only',
        database: 'not-checked',
        commerce: 'disabled',
      });
    }
  } finally {
    if (old === undefined) delete process.env.SALECENTAR_VERCEL_API_ENABLED;
    else process.env.SALECENTAR_VERCEL_API_ENABLED = old;
  }
});
