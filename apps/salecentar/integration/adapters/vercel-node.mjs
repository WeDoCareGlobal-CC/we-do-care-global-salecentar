/**
 * Future Vercel Node.js Function adapter.
 *
 * This file intentionally lives outside an /api directory and is NOT referenced
 * by vercel.json. Merely adding it must never expose SaleCentar endpoints.
 */
export default async function handler(req, res) {
  if (process.env.SALECENTAR_VERCEL_API_ENABLED !== 'true') {
    res.writeHead(503, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(JSON.stringify({ error: 'SaleCentar API staging is disabled' }));
    return;
  }
  // Import only after explicit enablement; module import validates staging
  // configuration and creates a lazy connection pool but never runs DDL.
  const { handleRequest } = await import('../server.mjs');
  return handleRequest(req, res);
}
