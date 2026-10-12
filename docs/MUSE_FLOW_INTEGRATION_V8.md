# Muse-Flow — module 3 of We Do Care Global SaleCentar (v8)

## Source
Imported directly from user-provided `Muse-Flow-main.zip`. Preserved existing React editor, research assistant, style guide, story arc, style fingerprint, mood rewriting, exports, and Gemini backend.

## Integration
- `apps/muse-flow`: new third module in the monorepo.
- SaleCentar central session introspection now supports `muse-flow` using a separate `SALECENTAR_MUSE_FLOW_SECRET`. Existing Menu Snap and ZeroBudget order sync sources remain unchanged.
- Muse-Flow `/api/auth/login` forwards staff credentials to SaleCentar. `/api/auth/logout` revokes the central session.
- All Muse-Flow AI endpoints require a valid SaleCentar central staff session (admin/viewer). Calls fail closed when SaleCentar is unavailable.
- Muse-Flow login UI keeps its session token in memory, and `src/services/api.ts` uses authenticated fetch for AI endpoints. Existing browser-local writing drafts remain browser-local.
- The Vite development server is mounted behind the same Express API middleware, preventing the former unprotected development API plugin from bypassing auth.
- Added to `catalog/products.json` as an internal pilot **without price or order flow**, because no commercial terms were supplied.
- Added to GitHub Actions module build matrix; `apps/muse-flow/.env.example` provides configuration placeholders.

## Run (after dependencies are installed)
1. Start the SaleCentar integration service with PostgreSQL and existing required secrets. Add `SALECENTAR_MUSE_FLOW_SECRET` (unique >=32 chars).
2. Create staff users using existing central bootstrap/admin endpoints.
3. In `apps/muse-flow`, set `SALECENTAR_AUTH_URL` to the **private** SaleCentar origin, set matching `SALECENTAR_MUSE_FLOW_SECRET`, and provide server-side `GEMINI_API_KEY`.
4. Install dependencies and run `npm run dev` for local development (Express+Vite on PORT 3002), or `npm run build && npm start` for production. Use HTTPS/private networking between services.
5. Log in with the central SaleCentar staff credentials.

## Known limitations / release gates
- Muse-Flow is a pilot staff tool, not an order/checkout module. No prices, payments, quotas or billing have been invented.
- Staff login is custom central session validation, not standards-based OIDC/OAuth SSO.
- Muse-Flow drafts are stored in browser localStorage, not a central multi-device PostgreSQL workspace. Avoid shared devices for sensitive writing.
- AI calls are not yet durably rate-limited or usage-metered. Add quotas and monitoring before public use.
- The central login endpoint may rate-limit module traffic as a shared IP; gateway-based per-account limits are needed.
- No end-to-end PostgreSQL, Gemini API, or full npm build was executed in this offline environment. The GitHub workflow must be run after pushing.
