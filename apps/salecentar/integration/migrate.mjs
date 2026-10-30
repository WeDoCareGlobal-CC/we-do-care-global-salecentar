import pg from 'pg';
import { runMigrations } from './migrations.mjs';

const databaseUrl = process.env.SALECENTAR_DATABASE_URL;
if (!databaseUrl) throw Error('SALECENTAR_DATABASE_URL is required for schema migration');
const shopifyWebhookSecret = process.env.SALECENTAR_SHOPIFY_WEBHOOK_SECRET;
if (shopifyWebhookSecret && shopifyWebhookSecret.length < 32) throw Error('Invalid Shopify webhook secret length');
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});
try {
  await runMigrations(pool,{shopifyWebhookSecret});
  console.log('SaleCentar migration completed');
} finally {
  await pool.end();
}
