import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { grantVerifiedOneTimeOrder } from './shopify-grant-tx.mjs';
import { revokeIneligibleOrder } from './shopify-revoke-tx.mjs';

const databaseUrl = process.env.SALECENTAR_TEST_DATABASE_URL;
if (process.env.SALECENTAR_REQUIRE_DB_TESTS === 'true' && !databaseUrl)
  throw Error('Shopify PostgreSQL test requires SALECENTAR_TEST_DATABASE_URL');

test('PostgreSQL: paid Shopify grant, refund revocation, manual entitlements and user cleanup', {
  skip: !databaseUrl && 'PostgreSQL test database not configured'
}, async () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const userId = randomUUID();
  const orderNumber = String(BigInt('1000000000') + BigInt(Date.now()));
  const orderId = 'gid://shopify/Order/' + orderNumber;
  const variantId = 'gid://shopify/ProductVariant/50985395224715';
  const customerId = 'gid://shopify/Customer/' + orderNumber;
  const moduleId = 'muse-flow';
  const port = 32031;
  const env = {
    ...process.env,
    SALECENTAR_DATABASE_URL: databaseUrl,
    SALECENTAR_SHOPIFY_WEBHOOK_SECRET: 'isolated-test-webhook-secret-at-least-32-characters',
    SALECENTAR_MENU_SNAP_SECRET: 'm'.repeat(40),
    SALECENTAR_ZERO_BUDGET_SECRET: 'z'.repeat(40),
    SALECENTAR_ADMIN_TOKEN: 'a'.repeat(40),
    SALECENTAR_ALLOW_LEGACY_ADMIN: 'true',
    SALECENTAR_PORT: String(port)
  };
  const server = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('.', import.meta.url), env, stdio: 'pipe'
  });
  let serverOutput = '';
  server.stderr.on('data', chunk => { serverOutput += chunk.toString().slice(0, 2048); });
  try {
    let ready = false;
    for (let i=0; i<100; i++) {
      if (server.exitCode != null) throw Error('Server exited during Shopify DDL: ' + serverOutput);
      try {
        if ((await fetch('http://127.0.0.1:' + port + '/health')).ok) { ready = true; break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'SaleCentar server starts with Shopify DDL: ' + serverOutput);
    await pool.query(`INSERT INTO sc_users(id,email,password_hash,role)
                      VALUES($1,$2,$3,'viewer')`,
      [userId, 'shopify-pg-' + userId + '@example.org', 'integration-test-not-login']);
    await pool.query(`INSERT INTO sc_shopify_customer_links(shop,customer_id,user_id,verified_at)
                      VALUES('k0702i-dq.myshopify.com',$1,$2,now())`, [customerId,userId]);
    await pool.query(`INSERT INTO sc_shopify_order_reviews
       (shop,order_id,customer_id,verified,reason,eligible_lines,checked_at)
       VALUES('k0702i-dq.myshopify.com',$1,$2,true,'fully_paid_eligible_order',$3::jsonb,now())`,
       [orderId,customerId,JSON.stringify([{variantId,quantity:1}])]);
    const args = {
      pool, orderId, variantId, moduleId,
      approvedOffers: new Map([[variantId,moduleId]]),
      enforcedModules: new Set([moduleId])
    };
    const grant = await grantVerifiedOneTimeOrder(args);
    assert.equal(grant.granted, true);
    const entitled = await pool.query(`SELECT enabled,provisioning_source
      FROM sc_module_entitlements WHERE user_id=$1 AND module_id=$2`,[userId,moduleId]);
    assert.deepEqual(entitled.rows[0], {enabled:true,provisioning_source:'shopify'});
    await assert.rejects(grantVerifiedOneTimeOrder(args), /already_processed|already processed|Grant already processed/i);
    await pool.query(`UPDATE sc_shopify_order_reviews SET verified=false,reason='refunded',
      eligible_lines='[]'::jsonb,customer_id=NULL,checked_at=now()
      WHERE shop='k0702i-dq.myshopify.com' AND order_id=$1`,[orderId]);
    const revoked = await revokeIneligibleOrder({pool,orderId});
    assert.equal(revoked.revoked,1);
    const disabled = await pool.query(`SELECT enabled,provisioning_source
      FROM sc_module_entitlements WHERE user_id=$1 AND module_id=$2`,[userId,moduleId]);
    assert.deepEqual(disabled.rows[0], {enabled:false,provisioning_source:'shopify'});
    await pool.query(`UPDATE sc_module_entitlements SET enabled=true,provisioning_source='manual'
      WHERE user_id=$1 AND module_id=$2`,[userId,moduleId]);
    assert.equal((await revokeIneligibleOrder({pool,orderId})).revoked,0);
    const preserved = await pool.query(`SELECT enabled,provisioning_source
      FROM sc_module_entitlements WHERE user_id=$1 AND module_id=$2`,[userId,moduleId]);
    assert.deepEqual(preserved.rows[0], {enabled:true,provisioning_source:'manual'});
  } finally {
    server.kill('SIGTERM');
    await pool.query(`DELETE FROM sc_shopify_order_reviews
      WHERE shop='k0702i-dq.myshopify.com' AND order_id=$1`,[orderId]).catch(()=>{});
    await pool.query('DELETE FROM sc_users WHERE id=$1',[userId]).catch(()=>{});
    await pool.end();
  }
});
