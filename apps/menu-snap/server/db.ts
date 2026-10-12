import pg from 'pg';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
export const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export function hashPassword(password: string) { const salt=randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
export function verifyPassword(password: string, stored: string) { const [salt,hash]=stored.split(':'); if(!salt||!hash)return false; const actual=scryptSync(password,salt,64); const expected=Buffer.from(hash,'hex'); return actual.length===expected.length&&timingSafeEqual(actual,expected); }
export async function migrate() {
 await pool.query(`CREATE TABLE IF NOT EXISTS app_users(id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', created_at TIMESTAMPTZ DEFAULT now());
 CREATE TABLE IF NOT EXISTS app_sessions(token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL);
 CREATE TABLE IF NOT EXISTS menus(id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES app_users(id), payload JSONB NOT NULL, approved BOOLEAN NOT NULL DEFAULT false, updated_at TIMESTAMPTZ DEFAULT now());
 CREATE TABLE IF NOT EXISTS ai_usage(user_id UUID NOT NULL REFERENCES app_users(id), day DATE NOT NULL, used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id,day));
 CREATE TABLE IF NOT EXISTS images(id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES app_users(id), mime TEXT NOT NULL, file_path TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
 CREATE TABLE IF NOT EXISTS orders(id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES app_users(id), menu_id UUID REFERENCES menus(id), offer_code TEXT NOT NULL, price_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'EUR', status TEXT NOT NULL DEFAULT 'pending', external_payment_reference TEXT UNIQUE, verified_by UUID REFERENCES app_users(id), verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());
 CREATE TABLE IF NOT EXISTS usage_events(id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES app_users(id), operation TEXT NOT NULL, status TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());`);
}
