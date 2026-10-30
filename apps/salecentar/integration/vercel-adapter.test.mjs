import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './adapters/vercel-node.mjs';

test('Vercel adapter rejects requests without explicit enablement', async () => {
  const old = process.env.SALECENTAR_VERCEL_API_ENABLED;
  delete process.env.SALECENTAR_VERCEL_API_ENABLED;
  try {
    const headers = {};
    let status = null;
    let body = '';
    await handler({method:'POST',url:'/webhooks/shopify'},{
      writeHead(code, value) { status = code; Object.assign(headers,value); },
      end(value) { body = value; },
    });
    assert.equal(status,503);
    assert.equal(headers['Cache-Control'],'no-store');
    assert.equal(JSON.parse(body).error,'SaleCentar API staging is disabled');
  } finally {
    if (old === undefined) delete process.env.SALECENTAR_VERCEL_API_ENABLED;
    else process.env.SALECENTAR_VERCEL_API_ENABLED = old;
  }
});
