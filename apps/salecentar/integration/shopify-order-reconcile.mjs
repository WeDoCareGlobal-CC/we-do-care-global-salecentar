import { SHOP_DOMAIN } from './shopify-billing.mjs';

const ORDER_QUERY = `query SaleCentarOrderVerification($id: ID!) {
  order(id: $id) {
    id
    cancelledAt
    displayFinancialStatus
    customer { id }
    lineItems(first: 100) {
      nodes { quantity variant { id } }
      pageInfo { hasNextPage }
    }
  }
}`;
const ORDER_ID = /^gid:\/\/shopify\/Order\/[1-9][0-9]*$/;
const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/[1-9][0-9]*$/;

// A paid order is not a license: it is only a reconciled purchase candidate.
// Identifying the buyer and writing an entitlement are separate, gated actions.
export function evaluateShopifyOrder(order, expectedOrderId, approvedVariants) {
  if (!ORDER_ID.test(expectedOrderId) || order?.id !== expectedOrderId)
    return { verified: false, reason: 'order_mismatch' };
  if (order.cancelledAt != null) return { verified: false, reason: 'cancelled' };
  if (order.displayFinancialStatus !== 'PAID')
    return { verified: false, reason: 'not_fully_paid' };
  if (!/^gid:\/\/shopify\/Customer\/[1-9][0-9]*$/.test(order.customer?.id || ''))
    return { verified: false, reason: 'no_customer' };
  const connection = order.lineItems;
  if (!Array.isArray(connection?.nodes) || !connection.nodes.length ||
      connection.pageInfo?.hasNextPage !== false)
    return { verified: false, reason: 'missing_or_truncated_lines' };
  if (!(approvedVariants instanceof Set) || approvedVariants.size === 0)
    return { verified: false, reason: 'missing_approved_variants' };
  const permitted = connection.nodes.filter(line =>
    Number.isSafeInteger(line.quantity) && line.quantity > 0 &&
    VARIANT_ID.test(line.variant?.id || '') && approvedVariants.has(line.variant.id)
  ).map(line => ({ variantId: line.variant.id, quantity: line.quantity }));
  if (!permitted.length) return { verified: false, reason: 'no_eligible_lines' };
  return { verified: true, orderId: order.id, customerId: order.customer.id, lines: permitted };
}

// Throws on missing credentials, API failures, GraphQL errors or mismatched orders.
// No webhook fields other than an order ID may be trusted for purchase entitlement.
export async function reconcileShopifyOrder({
  orderId, accessToken, approvedVariants, fetchImpl = fetch,
  shopDomain = SHOP_DOMAIN, apiVersion = '2026-10'
}) {
  if (shopDomain !== SHOP_DOMAIN) throw Error('Incorrect Shopify shop');
  if (!ORDER_ID.test(orderId)) throw Error('Invalid order ID');
  if (typeof accessToken !== 'string' || accessToken.length < 20)
    throw Error('Admin token not configured');
  if (!/^2026-(01|04|07|10)$/.test(apiVersion)) throw Error('Invalid API version');
  const response = await fetchImpl(`https://${SHOP_DOMAIN}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
    body: JSON.stringify({ query: ORDER_QUERY, variables: { id: orderId } }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw Error('Shopify Admin API unavailable');
  const json = await response.json();
  if (json.errors?.length || !json.data?.order) throw Error('Shopify order query failed');
  return evaluateShopifyOrder(json.data.order, orderId, approvedVariants);
}
