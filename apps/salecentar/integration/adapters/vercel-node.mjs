/**
 * Future Vercel Node.js Function adapter, NOT referenced by the current
 * Vercel service graph. No payment or auth routes may pass this gate.
 */
const reject = (res, status, error) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify({ error }));
};

export default async function handler(req, res) {
  if (process.env.SALECENTAR_VERCEL_API_ENABLED !== 'true') {
    return reject(res, 503, 'SaleCentar API staging is disabled');
  }

  // A future accidental rewrite must not make Shopify, auth, admin or billing
  // endpoints reachable. Read-only health is the only permitted operation.
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  if (req.method !== 'GET' || path !== '/health') {
    return reject(res, 404, 'Not found');
  }

  // Liveness only: do not import the backend or query PostgreSQL.
  // This must never be represented as commerce/database readiness.
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify({
    ok: true,
    component: 'salecentar-vercel-adapter',
    check: 'liveness-only',
    database: 'not-checked',
    commerce: 'disabled',
  }));
}
