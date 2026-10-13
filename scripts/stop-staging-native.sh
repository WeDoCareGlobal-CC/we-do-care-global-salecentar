#!/usr/bin/env bash
# Stop the native staging stack started by start-staging-native.sh.
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDDIR="$ROOT/.staging-pids"
for pidfile in "$PIDDIR"/*.pid; do
  [ -f "$pidfile" ] || continue
  name=$(basename "$pidfile" .pid)
  pid=$(cat "$pidfile")
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null && echo "STOPPED $name (pid $pid)"
  else
    echo "GONE   $name (pid $pid)"
  fi
  rm -f "$pidfile"
done
echo "done"
