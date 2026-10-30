import { entitlementDecision } from './shopify-access-policy.mjs';

export const SHOPIFY_GRANT_DDL = `
ALTER TABLE sc_module_entitlements ADD COLUMN IF NOT EXISTS provisioning_source TEXT NOT NULL DEFAULT 'manual';
CREATE TABLE IF NOT EXISTS sc_shopify_customer_links (
  shop TEXT NOT NULL CHECK (shop='k0702i-dq.myshopify.com'),
  customer_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES sc_users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(shop,customer_id),
  UNIQUE(shop,user_id)
);
CREATE TABLE IF NOT EXISTS sc_shopify_grants (
  shop TEXT NOT NULL CHECK (shop='k0702i-dq.myshopify.com'),
  order_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES sc_users(id),
  module_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(shop,order_id,variant_id)
);
`;

// Trusted internal worker only. Does NOT generate identity proofs or trust webhook claims.
export async function grantVerifiedOneTimeOrder({pool,orderId,variantId,moduleId,enforcedModules,approvedOffers,maxReviewAgeMs=300000}) {
  if (!(approvedOffers instanceof Map) || approvedOffers.get(variantId)!==moduleId)
    throw Error('Variant-to-module mapping not verified');
  if (!Number.isInteger(maxReviewAgeMs) || maxReviewAgeMs<1 || maxReviewAgeMs>300000)
    throw Error('Invalid review freshness policy');
  if (!(enforcedModules instanceof Set) || !enforcedModules.has(moduleId))
    throw Error('Module access enforcement not verified');
  if (!pool?.connect) throw Error('Database unavailable');
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const res=await client.query(`
      SELECT r.order_id,r.customer_id,r.verified,r.reason,r.eligible_lines,r.checked_at,
        l.user_id,l.verified_at,u.active
      FROM sc_shopify_order_reviews r
      LEFT JOIN sc_shopify_customer_links l ON l.shop=r.shop AND l.customer_id=r.customer_id
      LEFT JOIN sc_users u ON u.id=l.user_id
      WHERE r.shop='k0702i-dq.myshopify.com' AND r.order_id=$1
      FOR UPDATE OF r
    `,[orderId]);
    if(res.rowCount!==1)throw Error('Verified review not found');
    const row=res.rows[0];
    if(!row.active||!row.verified_at)throw Error('Customer not linked to active account');
    const checkedAt=Date.parse(row.checked_at);
    if(!Number.isFinite(checkedAt)||checkedAt>Date.now()||Date.now()-checkedAt>maxReviewAgeMs)
      throw Error('Fresh Shopify payment reconciliation required');
    const existing=await client.query(`
      SELECT order_id,variant_id FROM sc_shopify_grants
      WHERE shop='k0702i-dq.myshopify.com' AND order_id=$1 AND variant_id=$2 FOR UPDATE
    `,[orderId,variantId]);
    const decision=entitlementDecision({
      review:{verified:row.verified,reason:row.reason,orderId:row.order_id,
        customerId:row.customer_id,lines:row.eligible_lines},
      identity:{verified:true,userId:row.user_id,shopifyCustomerId:row.customer_id},
      offer:{kind:'one_time',variantId,moduleId,moduleEnforcesAccess:enforcedModules.has(moduleId)},
      previousGrant:existing.rowCount?{orderId:existing.rows[0].order_id,variantId:existing.rows[0].variant_id}:null
    });
    if(!decision.allow)throw Error('Access denied: '+decision.reason);
    const inserted=await client.query(`
      INSERT INTO sc_shopify_grants(shop,order_id,variant_id,user_id,module_id)
      VALUES('k0702i-dq.myshopify.com',$1,$2,$3,$4)
      ON CONFLICT DO NOTHING RETURNING order_id
    `,[orderId,variantId,row.user_id,moduleId]);
    if(inserted.rowCount!==1)throw Error('Grant already processed');
    const entitlementWrite=await client.query(`
      INSERT INTO sc_module_entitlements(user_id,module_id,enabled,provisioning_source,updated_at)
      VALUES($1,$2,true,'shopify',now())
      ON CONFLICT(user_id,module_id) DO UPDATE
      SET enabled=true,provisioning_source='shopify',updated_at=now()
      WHERE sc_module_entitlements.provisioning_source='shopify'
         OR sc_module_entitlements.enabled=false
      RETURNING user_id
    `,[row.user_id,moduleId]);
    if(entitlementWrite.rowCount!==1)
      throw Error('Existing independently managed entitlement must not be overwritten');
    await client.query('COMMIT');
    return {granted:true,userId:row.user_id,moduleId,orderId};
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}
