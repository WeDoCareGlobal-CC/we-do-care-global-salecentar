# GitHub Actions runner incident — SaleCentar (2026-10-30)

## Observed, not inferred
- Repo: WeDoCareGlobal-CC/we-do-care-global-salecentar
- Branch: feature/shopify-salecentar-billing-gates, draft PR #3.
- Billing safety run 40977309324 completed `failure` after ~4 seconds.
- Its billing-safety job 123808431982 has `runner_id: 0`, `steps: []`, and empty runner name in the Actions API.
- Workflow logs requests return BlobNotFound; job-step endpoint returns [].
- Existing V2 and SaleCentar runs on the same PR show similar failure symptoms.
- An older, different job in the repository, run 40942339628, completed successfully and has 5 steps. This does not prove current runner eligibility.
- A local workspace test execution passed 14/14 isolated Shopify security tests and `node --check` for the server and inbox. This covered files available in the workspace, **not the entire latest PR head**. Do not treat this as a CI pass.

## Assessment
Runner provisioning / Actions account settings / runner availability are plausible causes. These API observations are not sufficient to distinguish account billing limits, org/repo policy, service-side infrastructure or runner-selection issues. Do not claim a confirmed root cause.

## Human account-admin verification
1. Open https://github.com/WeDoCareGlobal-CC/we-do-care-global-salecentar/actions/runs/40977309324 .
2. Inspect the run/job banner for 'not started', spending limit, disabled Actions, runner restrictions or policy warnings.
3. Check organization and repository Settings > Actions > General: GitHub-hosted runners and allowed actions.
4. Check organization billing / GitHub Actions usage and spending-limit notifications. Do not change financial limits without approval.
5. Check GitHub Status for Actions issues and re-run only after the blocker is resolved.
6. Obtain a genuine green CI report for exact PR head, then run integration tests with a temporary PostgreSQL instance.
7. Keep PR draft and Shopify items unpublished until payment reconciliation, identity linking, entitlement database writes, refunds/cancellations, and customer-support workflows are end-to-end verified.

## Current safety scope
Only shop k0702i-dq.myshopify.com is authorized for SaleCentar integration; original shop.wedocare-global.com is excluded.
