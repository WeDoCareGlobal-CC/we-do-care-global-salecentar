#!/usr/bin/env bash
# Native (no-Docker) staging launcher — runs the full stack as local processes.
# Equivalent of docker-compose.yml on this host. PostgreSQL is already running
# natively on 127.0.0.1:5432 (salecentar_test).
#
# Usage: bash scripts/start-staging-native.sh
# Stop:  bash scripts/stop-staging-native.sh
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDDIR="$ROOT/.staging-pids"
mkdir -p "$PIDDIR"

# Shared test/staging secrets (isolated staging instance — not production).
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=
export POSTGRES_DB=salecentar_test
export SALECENTAR_DATABASE_URL="postgres://postgres@127.0.0.1:5432/salecentar_test"
export SALECENTAR_MENU_SNAP_SECRET="$(printf 'm%.0s' {1..40})"
export SALECENTAR_ZERO_BUDGET_SECRET="$(printf 'z%.0s' {1..40})"
export SALECENTAR_MUSE_FLOW_SECRET="$(printf 'f%.0s' {1..40})"
export SALECENTAR_SPEECH_GENERATOR_SECRET="$(printf 's%.0s' {1..40})"
export SALECENTAR_HERMES_SECRET="$(printf 'h%.0s' {1..40})"
export SALECENTAR_ADMIN_TOKEN="$(printf 'a%.0s' {1..40})"
export SALECENTAR_ALLOW_LEGACY_ADMIN=true
export SALECENTAR_TEST_ENV=1
export SPEECH_DAILY_LIMIT=20
export DATABASE_URL="$SALECENTAR_DATABASE_URL"
export SALECENTAR_AUTH_URL=http://127.0.0.1:3101
export SALECENTAR_SYNC_URL=http://127.0.0.1:3101/sync/menu-snap
export NODE_ENV=production

start_service(){
  local name=$1 port=$2 dir=$3 cmd=$4
  if curl -s -m 2 "http://127.0.0.1:$port/health" >/dev/null 2>&1 || curl -s -m 2 "http://127.0.0.1:$port/api/health" >/dev/null 2>&1; then
    echo "SKIP  $name (already running on :$port)"
    return 0
  fi
  ( cd "$ROOT/$dir" && nohup $cmd > "$PIDDIR/$name.log" 2>&1 & echo $! > "$PIDDIR/$name.pid" )
  echo "START $name on :$port (pid $(cat "$PIDDIR/$name.pid" 2>/dev/null))"
}

echo "=== Starting SaleCentar stack (native processes) ==="

# 1. central integration server (depends on postgres — already running)
start_service salecentar-integration 3101 apps/salecentar/integration "node server.mjs"
sleep 2

# 2. module servers (built artifacts)
[ -f "$ROOT/apps/menu-snap/dist/server.mjs" ] || (cd "$ROOT/apps/menu-snap" && npm run build >/dev/null 2>&1)
[ -f "$ROOT/apps/zerobudget-ai/dist/server.mjs" ] || (cd "$ROOT/apps/zerobudget-ai" && npm run build >/dev/null 2>&1)
[ -f "$ROOT/apps/muse-flow/dist/server.mjs" ] || (cd "$ROOT/apps/muse-flow" && npm run build >/dev/null 2>&1)

start_service menu-snap 3000 apps/menu-snap "node dist/server.mjs"
start_service zerobudget-ai 3001 apps/zerobudget-ai "node dist/server.mjs"
start_service muse-flow 3002 apps/muse-flow "node dist/server.mjs"
start_service speech-generator 3013 apps/speech-generator "node server.mjs"

# 3. wait for health
sleep 4
echo ""
echo "=== Health check ==="
for svc in "salecentar-integration:3101:/health" "menu-snap:3000:/api/health" "zerobudget-ai:3001:/api/health" "muse-flow:3002:/api/health" "speech-generator:3013:/api/health"; do
  name=${svc%%:*}; rest=${svc#*:}; port=${rest%%:*}; path=${rest#*:}
  if curl -s -m 3 "http://127.0.0.1:$port$path" >/dev/null 2>&1; then
    echo "UP    $name  http://127.0.0.1:$port$path"
  else
    echo "DOWN  $name  http://127.0.0.1:$port$path  (log: .staging-pids/$name.log)"
  fi
done
