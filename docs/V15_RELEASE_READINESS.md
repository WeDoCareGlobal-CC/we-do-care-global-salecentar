# v15 — Release readiness and pilot checklist

## Automated checks
- `node scripts/verify-config.mjs` checks example configuration.
- `node --test scripts/verify-config.test.mjs scripts/release-audit.test.mjs` checks configuration and release inventory.
- `node scripts/release-audit.mjs` verifies that all five modules and required CI jobs are present.
- `.github/workflows/salecentar-quality.yml` is intended to run real PostgreSQL integration tests and build checks in GitHub Actions.

## Deployment gates (must be completed before public launch)
1. Run GitHub Actions on the exact release commit and retain successful logs; local tests alone are insufficient.
2. Provision isolated PostgreSQL databases, use least-privilege DB roles and TLS, and run integration tests against a disposable database.
3. Set distinct high-entropy secrets using the deployment secret manager. Never commit `.env` files. Disable legacy admin token and development/bootstrap access after first admin creation.
4. Restrict CORS, allowed hosts and ingress to HTTPS. Protect `/control`, `/portal`, and financial reporting routes; review login rate limiting and session expiry.
5. Configure backups and retention: daily encrypted PostgreSQL backups plus periodic restore drills; separately back up Hermes SQLite if still in use. Record RPO/RTO and owners.
6. Monitor 5xx rates, failed authentication, sync replay/conflicts, TTS/AI spend, quota usage, DB pool health, and payment reconciliation exceptions.
7. Keep Hermes simulation disabled on publicly exposed services. Do not count facilitator-reported payments as independently verified blockchain receipts.
8. Validate TTS provider credentials and audio output, central SSO, Muse-Flow integration and all five modules in staging.
9. Test data deletion, log redaction and recovery from failed deployments before onboarding pilot users.
10. Start with a restricted pilot and manual financial reconciliation; production launch requires separate sign-off.

## Open limitations
- PostgreSQL end-to-end tests and full dependency-based builds cannot be confirmed without PostgreSQL and network dependencies.
- No live blockchain settlement or independent receipt validation was performed.
- No live AI/TTS vendor requests were performed.
- No real backup or restore was executed.
- Portal entitlement/billing management and Muse-Flow → Speech Generator remain incomplete.
