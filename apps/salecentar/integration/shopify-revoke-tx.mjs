import { SHOP_DOMAIN } from './shopify-billing.mjs';

// Migration extension: must be applied with SHOPIFY_GRANT_DDL and reviews table.
export const SHOPIFY_REVOCATION_DDL = `
ALTER TABLE sc_shopify_grants
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
`;

// REQUIRES a fresh authenticated Shopify Admin API reconciliation showing that
// this order is no longer eligible. Never call this from an unverified webhook.
// Preserves access when another active grant exists for the same user/module.
export async function revokeIneligibleOrder({pool,orderId}) {
  if (!pool?.connect) throw Error('Database unavailable');
  if (!/^gid:\/\/shopify\/Order\/[1-9][0-9]*$/.test(orderId || ''))
    throw Error('Invalid order ID');
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const review=await client.query(`
      SELECT verified,reason,checked_at FROM sc_shopify_order_reviews
      WHERE shop=$1 AND order_id=$2 FOR UPDATE
    `,[SHOP_DOMAIN,orderId]);
    const checkedAt=Date.parse(review.rows[0]?.checked_at);
    if(!Number.isFinite(checkedAt)||checkedAt>Date.now()||Date.now()-checkedAt>300000)
      throw Error('Fresh Shopify reconciliation required');
    if(review.rowCount!==1 || review.rows[0].verified!==false ||
        !['cancelled','refunded'].includes(review.rows[0].reason))
      throw Error('Authoritative ineligible review required');
    const grants=await client.query(`
      UPDATE sc_shopify_grants
      SET revoked_at=now()
      WHERE shop=$1 AND order_id=$2 AND revoked_at IS NULL
      RETURNING user_id,module_id
    `,[SHOP_DOMAIN,orderId]);
    const affected=new Set(grants.rows.map(x=>`${x.user_id}|${x.module_id}`));
    for(const key of affected) {
      const [userId,moduleId]=key.split('|');
      const other=await client.query(`
        SELECT 1 FROM sc_shopify_grants
        WHERE shop=$1 AND user_id=$2 AND module_id=$3 AND revoked_at IS NULL
        LIMIT 1
      `,[SHOP_DOMAIN,userId,moduleId]);
      if(!other.rowCount){
        await client.query(`
          UPDATE sc_module_entitlements SET enabled=false,updated_at=now()
          WHERE user_id=$1 AND module_id=$2 AND provisioning_source='shopify'
        `,[userId,moduleId]);
      }
    }
    await client.query('COMMIT');
    return {revoked:grants.rowCount, affectedModules:affected.size};
  } catch(error){
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}
