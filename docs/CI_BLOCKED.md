# CI BLOCKED — GitHub Actions startup_failure

Status: **BLOCKED** (as of v18 merge, 2026-10-13)

## Summary

Every GitHub Actions run on this repository fails with `startup_failure`
after 0 seconds, with **zero jobs created**. This happens on all branches,
including `main`, and for both `pull_request` and `workflow_dispatch`
events. It is not caused by the repository code.

## What was verified (facts, not assumptions)

1. **Token has the `workflow` scope** (`gh auth status` → `gist, read:org, repo, workflow`).
2. **Both workflow files are valid YAML** — `salecentar-quality.yml`
   parses with 5 jobs, `menu-snap-check.yml` with 1 job (validated with
   `yaml.safe_load`).
3. **Repository Actions are enabled** —
   `GET /repos/.../actions/permissions` → `{"enabled":true,"allowed_actions":"all"}`.
4. **The same failure predates all v18 work** — runs on `main` before this
   branch existed also fail with `startup_failure`.
5. **Isolation test:** the same token successfully dispatched a CI run on
   `we-do-care-global/agentguard` (a public repo) — it queued and executed
   normally. Only the private salecentar repo fails.
6. **Organization plan** —
   `GET /orgs/WeDoCareGlobal-CC` → `plan.name: "free"` (verified).

## What could NOT be verified (no access)

- The billing usage endpoint returns **HTTP 410 (endpoint moved)** and
  requires the `admin:org` scope, which the current token does not have.
  Therefore **the exact cause is not proven**. The combination of a
  free-plan organization, a private repository, zero-job startup failures,
  and a working public repo strongly suggests a billing/quota gate on
  private-repo Actions minutes, but this is **not explicitly confirmed**.

## What is needed to resolve

Any ONE of:
- `gh auth refresh -h github.com -s admin:org`, then re-check
  `GET /orgs/WeDoCareGlobal-CC/settings/billing/actions`
- Check in GitHub UI: Organization → Settings → Billing and plans →
  Actions minutes used vs. included
- Add a payment method / spending limit to the organization
- Make the repository public (changes exposure — security review required first)

## Interim mitigation

All CI-equivalent verification is executed locally and in this repository's
test suites:
- SaleCentar integration (PostgreSQL 16.3): 35/35 pass
- Cross-module entitlement script: 19/19 pass
- Speech Generator: 7/7 · Hermes x402: 33/33 · Menu Snap: 4/4
- All lints and builds clean

Do not treat this document as proof that CI passes — CI has never run.
It documents exactly why CI could not be executed and what evidence exists.
