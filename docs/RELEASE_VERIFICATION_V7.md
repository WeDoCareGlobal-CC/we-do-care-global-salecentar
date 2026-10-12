# We Do Care Global SaleCentar — v7 release verification

## Confirmed locally
- `npm test` in `apps/salecentar/integration`: 24 tests, **22 pass, 2 skip, 0 fail**.
- The two skipped tests require `SALECENTAR_TEST_DATABASE_URL` and a live PostgreSQL server.
- Both module build scripts now emit **ES modules** (`dist/server.mjs`) to match `type: module`, and `npm start` sets `NODE_ENV=production`.
- GitHub Actions checks for `dist/index.html` and `dist/server.mjs` and runs `node --check` on the server bundle after each module build.

## Blockers independently verified
- `npm view pg version --fetch-retries=0 --fetch-timeout=7000` failed with `EAI_AGAIN registry.npmjs.org`.
- `npm install --offline` failed with `ENOTCACHED`; required packages are not available locally.
- No `postgres`, `pg_ctl`, `initdb`, Docker or Podman executable is available.
- No lockfiles are included in this archive. Do not use `npm ci` until lockfiles are generated and committed.

## Verification in a network-enabled environment
1. For each of `apps/menu-snap`, `apps/zerobudget-ai`, `apps/salecentar`, `apps/salecentar/integration`, run `npm install` and commit the resulting `package-lock.json`. After that, use `npm ci` in CI.
2. Run `npm run lint` and `npm run build` for Menu Snap and ZeroBudget AI; `npm run build` for SaleCentar. Confirm `dist/server.mjs` and `dist/index.html`.
3. Start a **disposable** PostgreSQL 16 instance; set `SALECENTAR_TEST_DATABASE_URL` to its database and run `npm test` in `apps/salecentar/integration`. Expect **24 passed, 0 skipped**.
4. Push to GitHub to run `.github/workflows/salecentar-quality.yml`; inspect actual Actions logs and fix any failing jobs.
5. Validate a real session lifecycle across modules and verify that order status changes are authorized. Perform backups and threat review before public deployment.

## Known limitations
- GitHub Actions has not been executed in this session; the workflow is not proof of a passing build.
- Package installation and full app builds remain unverified due to network/dependency restrictions.
- Database integration remains unverified due to missing PostgreSQL.
- Custom staff session federation is not standards-based OAuth/OIDC; existing user mapping and operational hardening need review.
- No payment processor verification or public deployment has been completed.
