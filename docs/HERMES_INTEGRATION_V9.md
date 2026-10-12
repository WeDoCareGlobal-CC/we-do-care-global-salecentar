# Hermes x402 Profit — v9 security pilot

Hermes is now a **fourth standalone service** in We Do Care Global SaleCentar. It is NOT wired into SaleCentar PostgreSQL orders or payment verification yet. No live payments were made.

## Security changes
- `/profit/summary`, `/profit/settlements`, `/dashboard`, `/` require `x-hermes-admin-key` matching the private `HERMES_ADMIN_API_KEY`. Without a configured key they return 403.
- Browser dashboard cannot directly supply the required header; use an authenticated reverse proxy or internal admin integration later. Do not publish it directly.
- `settlement_modes` and `confirmed_usdc` distinguish facilitator-confirmed, simulated, and legacy/unverified entries. Existing `gross_usdc` is a historical *all-settled* figure, **not confirmed income**. Do not use it for central revenue.
- Decimal aggregation replaces floating point aggregation for summary, per-resource totals and top payers.
- CLI refuses public simulated settlement unless `X402_ALLOW_PUBLIC_SIMULATION=true`; Azure application entrypoint is simulation-only and also fails closed for public simulation without the explicit flag.
- No production payments, real CDP credentials, database migrations, or verified settlement proof implemented.

## Remaining blockers
- Require actual blockchain receipt verification and idempotent central PostgreSQL ingestion before recording confirmed revenue centrally.
- Evaluate cross-network nonce uniqueness and concurrency locking; existing SQLite nonce constraint is global.
- Production admin authorization should be based on central SaleCentar sessions via backend proxy, not browser storage of the Hermes key.
- Legacy rows with `detail.simulated=false` and `settled_at` are **self-reported** facilitator confirmations, not independently validated on-chain.
- Existing worker API functions and their prices are unchanged.
- Run CI with Python dependencies and the actual PostgreSQL service. Review Hermes existing tests for network/API compatibility.
