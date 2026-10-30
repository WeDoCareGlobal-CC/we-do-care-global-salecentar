// Pure authorization gate. Upstream attestations must come from the trusted
// Shopify Admin API and authenticated customer-account identity.
const ID = /^gid:\/\/shopify\/(Order|Customer|ProductVariant)\/[1-9][0-9]*$/;
const USER = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const MODULES = new Set(['menu-snap','zerobudget-ai','muse-flow','speech-generator','salespuls','interior-ai','portfolio-ai','music-studio']);
export function entitlementDecision({review, identity, offer, previousGrant=null}) {
  if (!review?.verified || review?.reason !== 'fully_paid_eligible_order') return {allow:false,reason:'unverified_payment'};
  if (!ID.test(review.orderId||'') || !review.orderId.includes('/Order/')) return {allow:false,reason:'invalid_order'};
  if (!ID.test(review.customerId||'') || !review.customerId.includes('/Customer/')) return {allow:false,reason:'invalid_customer'};
  if (identity?.verified !== true || identity.shopifyCustomerId !== review.customerId || !USER.test(identity.userId||''))
    return {allow:false,reason:'unverified_customer_identity'};
  if (offer?.kind !== 'one_time' || !MODULES.has(offer?.moduleId) || offer?.moduleEnforcesAccess !== true ||
      !ID.test(offer?.variantId||'') || !offer.variantId.includes('/ProductVariant/'))
    return {allow:false,reason:'unsupported_offer'};
  if (!Array.isArray(review.lines) || !review.lines.some(x=>x.variantId===offer.variantId && Number.isSafeInteger(x.quantity) && x.quantity>0))
    return {allow:false,reason:'variant_not_purchased'};
  if (previousGrant && previousGrant.orderId===review.orderId && previousGrant.variantId===offer.variantId)
    return {allow:false,reason:'already_processed'};
  return {allow:true,reason:'eligible_for_transactional_grant',userId:identity.userId,moduleId:offer.moduleId,orderId:review.orderId,variantId:offer.variantId};
}
