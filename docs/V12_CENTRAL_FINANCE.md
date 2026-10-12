# v12 — Hermes central finance hardening

## Implemented
- Strict settlement payload validation: canonical positive integer atomic units, allowed modes, bounded fields, hex transaction hashes and valid timestamps.
- Full economic identity comparison for idempotent `(network,nonce)` replay, including payer, payee, resource, asset, mode and transaction hash.
- Summary returns separate `facilitator_reported`, `simulated`, and `unverified` buckets. `independently_verified` intentionally stays empty until independently verifiable blockchain receipt validation is built.
- Five unit tests for the policy; central integration suite includes them.

## Critical limitations
- **Not an independent on-chain verifier**. The `facilitator_reported` state is a claim recorded by Hermes and must not be called final settled revenue.
- No exchange rate conversion or reconciliation against bank balances.
- Actual PostgreSQL E2E and full application builds were not run locally (database/dependencies unavailable).
- Import is manual through `apps/hermes-x402/export_salecentar.py`.
- No live USDC payments initiated.

## Next
1. Implement a trusted chain RPC verifier: match chain ID, USDC contract, recipient, transfer amount and finality; record immutable receipt/block evidence and handle reorgs.
2. Add database-backed reconciliation jobs with state transitions, failure alerts and manual review.
3. Run PostgreSQL integration tests in CI and examine failures before any public launch.
4. Keep simulation out of all recognized-revenue dashboards.
