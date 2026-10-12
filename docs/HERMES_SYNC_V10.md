# Hermes → SaleCentar v10

The central PostgreSQL endpoint `POST /sync/hermes` receives timestamped HMAC-SHA256 signed batches. It uses a `(network, nonce)` primary key and rejects conflicting replays. `GET /admin/hermes/summary` requires central admin authorization.

The Hermes-side `apps/hermes-x402/export_salecentar.py` is a **manual** sync tool. Preview: `python export_salecentar.py --db /path/to/hermes.db`. Send: `SALECENTAR_HERMES_SECRET=... python export_salecentar.py --db /path/to/hermes.db --url http://127.0.0.1:3101 --send`. Configure the same distinct secret in SaleCentar.

`facilitator_reported` is NOT independently verified on-chain. Simulated and unverified entries are separately labeled. No automatic or live payment is initiated. Never equate all imported amounts to actual revenue. Reconciliation against blockchain receipts, service authentication, observability, and real PostgreSQL E2E testing are still required.
