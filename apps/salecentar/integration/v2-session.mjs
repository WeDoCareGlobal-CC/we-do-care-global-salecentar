import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const TOKEN_COOKIE = 'sc_v2_session';
const CSRF_COOKIE = 'sc_v2_csrf';
const hash = token => createHash('sha256').update(token).digest('hex');
const equal = (a,b) => {
  const x = Buffer.from(String(a ?? '')), y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x,y);
};
export function parseCookies(header = '') {
  const result = new Map();
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const key = part.slice(0,i).trim();
    const value = part.slice(i+1).trim();
    if (!result.has(key)) result.set(key,value);
  }
  return result;
}
export function sessionCookies(token, csrf, {secure = true} = {}) {
  if (!secure) throw new Error('Secure cookies are required for v2');
  const options = 'Path=/; Secure; SameSite=Strict; Max-Age=86400';
  return [
    TOKEN_COOKIE+'='+token+'; HttpOnly; '+options,
    CSRF_COOKIE+'='+csrf+'; '+options,
  ];
}
export function clearSessionCookies() {
  return [
    TOKEN_COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0',
    CSRF_COOKIE+'=; Path=/; Secure; SameSite=Strict; Max-Age=0',
  ];
}
export function createSessionToken() { return randomBytes(32).toString('base64url'); }
export function createCsrfToken() { return randomBytes(32).toString('base64url'); }
export async function resolveV2Session(pool, cookieHeader) {
  const token = parseCookies(cookieHeader).get(TOKEN_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const q = await pool.query(
    'SELECT u.id,u.email,u.role FROM sc_sessions s JOIN sc_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true',
    [hash(token)]
  );
  return q.rows[0] ?? null;
}
export function validCsrf(cookieHeader, submittedToken) {
  const csrf = parseCookies(cookieHeader).get(CSRF_COOKIE);
  return !!csrf && /^[A-Za-z0-9_-]{43}$/.test(csrf) && equal(csrf, submittedToken);
}
export function validSameOrigin(req, expectedOrigin) {
  const origin = req.headers.origin;
  return typeof origin === 'string' && origin === expectedOrigin;
}
export const v2SessionCookieName = TOKEN_COOKIE;
export const hashV2Token = hash;
