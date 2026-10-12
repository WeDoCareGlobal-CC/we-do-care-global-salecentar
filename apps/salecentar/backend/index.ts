import { router, json, error, requireAuth, requireAdminEmailAllowlist } from '@appdeploy/sdk';

const ADMIN_EMAILS = ['emirperla96@gmail.com'];

let webhooks = [
  { id: 'wh-1', name: 'Product Synced', event: 'product.synced' },
  { id: 'wh-2', name: 'Commission Recorded', event: 'commission.recorded' },
];

const products: unknown[] = []; // No fabricated affiliate products; catalog lives in catalog/products.json.

const owner = [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS)];

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'GET /api/webhooks': [...owner, async () => json({ webhooks })],
  'POST /api/webhooks': [...owner, async ({ body }) => {
    const x = body as { name?: string; event?: string };
    if (!x.name || !x.event) return error('name and event are required', 400);
    webhooks = webhooks.concat({ id: 'wh-' + Date.now(), name: x.name, event: x.event });
    return json({ webhooks }, 201);
  }],
  'POST /api/research': [...owner, async ({ body }) => {
    const x = body as { query?: string };
    if (!x.query) return error('query is required', 400);
    return json({ status: 'provider_not_configured', query: x.query, message: 'Connect a Tavily-compatible provider using an encrypted backend secret.', integration: 'Tavily search/extract/research/crawl/map' });
  }],
  'GET /api/export': [...owner, async ({ query }) => {
    if ((query.format || 'json') !== 'json') return error('JSON is the active export format.', 400);
    return json({ schema: 'we-do-care-salecentar/v1', brand: 'We Do Care Global SaleCentar', exportedAt: new Date().toISOString(), products, webhooks, integrations: ['Amazon Creators API-ready', 'Awin adapter', 'Admitad adapter', 'Tavily research'] });
  }],
});