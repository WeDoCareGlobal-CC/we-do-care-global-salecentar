import { SHOPIFY_REVIEWS_DDL } from './shopify-order-review.mjs';
import { SHOPIFY_GRANT_DDL } from './shopify-grant-tx.mjs';
import { SHOPIFY_REVOCATION_DDL } from './shopify-revoke-tx.mjs';
import { SHOPIFY_INBOX_DDL } from './shopify-webhook-inbox.mjs';

/** Apply SaleCentar's existing schema explicitly, never during a serverless import. */
export async function runMigrations(pool,{shopifyWebhookSecret}={}) {
  await pool.query(`CREATE TABLE IF NOT EXISTS salecentar_orders(
   source TEXT NOT NULL,source_order_id UUID NOT NULL,customer_email TEXT NOT NULL,
   offer_code TEXT NOT NULL,price_cents INTEGER NOT NULL,currency TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'pending',external_payment_reference TEXT,
   source_created_at TIMESTAMPTZ,updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY(source,source_order_id))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS salecentar_payment_events(
   id UUID PRIMARY KEY,source TEXT NOT NULL,source_order_id UUID NOT NULL,
   old_status TEXT NOT NULL,new_status TEXT NOT NULL,reference TEXT NOT NULL,
   actor TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   FOREIGN KEY(source,source_order_id) REFERENCES salecentar_orders(source,source_order_id))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sc_hermes_settlements(
   network TEXT NOT NULL,tx_hash TEXT NOT NULL,nonce TEXT NOT NULL,
   asset TEXT NOT NULL,amount_atomic NUMERIC(78,0) NOT NULL CHECK(amount_atomic>0),
   payer TEXT NOT NULL,pay_to TEXT NOT NULL,resource TEXT NOT NULL,
   settlement_mode TEXT NOT NULL CHECK(settlement_mode IN ('facilitator_reported','simulated','unverified')),
   source_created_at TIMESTAMPTZ,ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY(network,nonce),UNIQUE(network,tx_hash,asset)
  )`); 
  await pool.query(`CREATE TABLE IF NOT EXISTS sc_users(
   id UUID PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,
   role TEXT NOT NULL CHECK(role IN ('admin','viewer')),active BOOLEAN NOT NULL DEFAULT true,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sc_sessions(
   token_hash TEXT PRIMARY KEY,user_id UUID NOT NULL REFERENCES sc_users(id) ON DELETE CASCADE,
   expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sc_module_entitlements(
   user_id UUID NOT NULL REFERENCES sc_users(id) ON DELETE CASCADE,
   module_id TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT false,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY(user_id,module_id))`);
  await pool.query(`ALTER TABLE sc_module_entitlements ADD COLUMN IF NOT EXISTS provisioning_source TEXT NOT NULL DEFAULT 'manual'`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sc_speech_usage(
   request_id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES sc_users(id) ON DELETE CASCADE,
   day DATE NOT NULL, status TEXT NOT NULL CHECK(status IN ('reserved','succeeded','failed')),
   characters INTEGER NOT NULL CHECK(characters BETWEEN 1 AND 3000),
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ)`);
  if(shopifyWebhookSecret) {
   await pool.query(SHOPIFY_INBOX_DDL);
   await pool.query(SHOPIFY_REVIEWS_DDL);
   await pool.query(SHOPIFY_GRANT_DDL);
   await pool.query(SHOPIFY_REVOCATION_DDL);
  }
}
