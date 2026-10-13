/**
 * SaleCentar 2.0 independent API transport.
 * No AppDeploy SDK or browser-stored bearer tokens.
 * Auth is expected to use an HttpOnly, Secure, SameSite session cookie.
 * Server-side RBAC and CSRF validation are mandatory before deployment.
 */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
export type ModuleId = 'menu-snap' | 'zerobudget-ai' | 'muse-flow' | 'hermes-x402' | 'speech-generator';
export type SessionUser = { id: string; email: string; role: 'admin' | 'viewer' };
export type SessionResponse = { user: SessionUser | null };
export type ModuleEntitlement = { module_id: ModuleId; name: string; status: string; enabled: boolean };
const API_BASE = (import.meta.env.VITE_SALECENTAR_API_BASE || '').replace(/\/$/, '');
export async function centralRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('API path must be relative');
  const response = await fetch(API_BASE + path, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
      ? body.error : 'Request failed';
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}
export const centralApi = {
  session: () => centralRequest<SessionResponse>('/api/v2/session'),
  login: (email: string, password: string) => centralRequest<{ user: SessionUser }>('/api/v2/login', { method: 'POST', body: JSON.stringify({email,password}) }),
  logout: () => centralRequest<{ ok: boolean }>('/api/v2/logout', { method: 'POST', headers: { 'X-CSRF-Token': document.cookie.split('; ').find(x => x.startsWith('sc_v2_csrf='))?.slice('sc_v2_csrf='.length) ?? '' } }),
  entitlements: () => centralRequest<{ modules: ModuleEntitlement[] }>('/api/v2/modules'),
};
