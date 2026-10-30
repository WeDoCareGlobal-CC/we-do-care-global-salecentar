// Root-level staging health endpoint for Vercel Root Directory './'.
// No Shopify, credentials, database, or network requests.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  return res.status(200).json({ status: 'ok', service: 'salecentar-staging', runtime: 'vercel-function' });
}
