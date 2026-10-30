#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( node_major < 22 )); then
  echo "Node.js 22+ required (detected: $(node --version))" >&2
  exit 1
fi
echo "Checking SaleCentar integration syntax..."
for file in server.mjs shopify-billing.mjs shopify-webhook-inbox.mjs shopify-order-reconcile.mjs shopify-order-review.mjs shopify-access-policy.mjs shopify-grant-tx.mjs shopify-revoke-tx.mjs; do
  node --check "$file"
done
echo "Running all Shopify security tests..."
node --test shopify-billing.test.mjs shopify-webhook-inbox.test.mjs shopify-order-reconcile.test.mjs shopify-order-review.test.mjs shopify-access-policy.test.mjs shopify-grant-tx.test.mjs shopify-revoke-tx.test.mjs shopify-provenance.test.mjs
echo "Security checks passed for checked out commit $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
