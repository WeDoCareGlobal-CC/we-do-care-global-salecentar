# v15 — Release readiness and pilot runbook

## Status
This is a release-readiness hardening package, **not** a production certification.
No live PostgreSQL restore, provider API call, blockchain settlement, or hosted smoke test was run locally.

## Deployment gates
1. Push the repository; require all jobs in `.github/workflows/salecentar-quality.yml` to pass.
2. Confirm real PostgreSQL tests run (not skipped) and that all Node/Python module builds/tests pass.
3. Provision separate production databases and scoped service credentials; configure HTTPS, trusted reverse proxy, request size limits, and network isolation for internal endpoints.
4. Disable `SALECENTAR_ALLOW_LEGACY_ADMIN`, rotate all development/test credentials, use distinct 32+ character module secrets and store them in secret management, never Git.
5. Keep Hermes in simulation/testnet until facilitator receipts have been independently reconciled with on-chain evidence. Never treat facilitator-reported as blockchain-confirmed.
6. Configure provider spending limits, rate limits, TTS quotas in durable storage, error monitoring, and an incident contact before onboarding pilot users.
7. Verify access isolation: staff roles, session logout/revocation, finance endpoints, and portal module visibility. Portal catalog visibility is NOT an entitlement.
8. Conduct privacy and data-retention review for AI prompts, speech text/audio and payment metadata.
9. Back up PostgreSQL to encrypted private storage with restricted access, retention and periodic isolated restore drills.
10. Pilot with limited accounts and no automatic live financial activation. Capture evidence for each gate and rollback instructions.

## Backup and recovery
`BACKUP_DIR=/private/backups SALECENTAR_DATABASE_URL=... bash scripts/backup-postgres.sh`
This uses `pg_dump` custom format and restrictive file permissions. Backups must be encrypted and transferred to a separate secured location.

**Restore only to an isolated empty database:**
`BACKUP_FILE=/private/backups/file.dump RESTORE_DATABASE_URL=... CONFIRM_ISOLATED_RESTORE=YES bash scripts/restore-postgres.sh`
Never run this blindly against production. Verify schema, counts, login and integration behavior after restore.

## Rollback
Pause intake/settlement, retain audit logs, restore the last tested application release; for destructive schema changes use a separately validated database rollback plan. Reconcile Hermes events before reopening intake.

## Known blockers
- PostgreSQL integration and restore drill not verified in this execution environment.
- Node package installs, complete production builds, Python dependency tests, and deployment need CI evidence.
- Speech provider live output, Muse-Flow → Speech integration, persistent TTS quotas remain unverified/unfinished.
- Hermes independent blockchain confirmation remains unimplemented; no production payment authorization.
- Customer entitlements and full user self-service are not implemented.
