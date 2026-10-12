# We Do Care Global SaleCentar — v6 build and PostgreSQL verification

## What was executed in this workspace
- `npm test` in `apps/salecentar/integration`: **20 passed, 2 skipped, 0 failed**.
- Node v22.16.0 / npm v10.9.2 available.
- Attempted `npm ci --offline` in all four package directories: cannot run because **no package-lock.json** files exist.
- Attempted `npm install --offline` in all four package directories: cannot run because the npm cache lacks dependencies, including `@google/genai`, `pg` and React type packages.
- PostgreSQL server and Docker/Podman are not installed in this environment. Consequently neither PostgreSQL integration test was executed, and none of the three complete builds is verified.

## Improvements in this version
- Added `auth.db.integration.test.mjs`, which tests creating a viewer, rejecting invalid login, central session creation, module-specific introspection, viewer role enforcement and logout/revocation using a real PostgreSQL database.
- Added both PostgreSQL tests and central SSO contract tests to `apps/salecentar/integration/package.json`'s `npm test` script. Previously the script omitted the SSO contract tests.
- The existing `.github/workflows/salecentar-quality.yml` starts PostgreSQL 16 and executes `npm test`, lint and builds for both modules, plus the SaleCentar frontend build. Its outcome is **not** verified because there is no GitHub Actions execution here.

## Release gates before public deployment
1. Run `npm install` (or generate and commit audited lockfiles and switch CI to `npm ci`) for each package. Record exact dependency versions and vulnerability review.
2. Run `npm run lint && npm run build` in `apps/menu-snap` and `apps/zerobudget-ai`; run `npm run build` in `apps/salecentar`.
3. Run `npm test` in `apps/salecentar/integration` with `SALECENTAR_TEST_DATABASE_URL` pointing to a **disposable PostgreSQL test database**. Expect all 22 tests to pass, with 0 skipped. Never run against production data.
4. Run a full browser and API smoke test for central login, Menu Snap menu ownership, ZeroBudget AI pilot order creation, SaleCentar dashboard, and verified payment status.
5. Fix the known pre-release risks: centralized login is a staff-only custom session system rather than OIDC; ZeroBudget AI quotas are not durable; Menu Snap user identity is matched by email; no proven payment processor integration; no public deployment hardening.
6. Use a private HTTPS/mTLS or loopback link for module-to-SaleCentar calls; protect module secrets and database credentials; establish backups, migrations, rate limiting, observability, and restore tests.

## Reproducible CI
`.github/workflows/salecentar-quality.yml` is the intended online build/DB validation route. It needs a push to GitHub to run, which was not performed in this session.

## Status
**Test harness improved and local dependency-free tests passed. Full build, real database integration, production payment, deployment and GitHub push are unverified.**
