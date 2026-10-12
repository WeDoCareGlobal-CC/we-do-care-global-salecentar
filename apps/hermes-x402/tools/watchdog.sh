#!/data/user/0/com.hermesagent.android/files/usr/bin/bash
# Keep the x402 server and its public tunnel alive.
#
# localhost.run's free tier drops idle tunnels after roughly 20 minutes, and the
# SSH forwarder dies with it, so the public URL has to be re-established. The
# current URL is written to $STATE so callers can discover it rather than
# hardcoding a hostname that changes on every restart.
#
# Run from cron every few minutes. Safe to run repeatedly.

set -u

PY=/data/user/0/com.hermesagent.android/files/usr/bin/python3.13
PROJECT="$HOME/hermes-x402-profit"
S="$HOME/.hermes/cache/scratch"
DB="$S/x402_dash.db"
LOG="$S/x402_live.log"
STATE="$S/public_url.txt"
PORT=9124

mkdir -p "$S"

# 1. The application itself. Without this the tunnel has nothing to forward to.
if ! curl -s -m 5 "http://127.0.0.1:$PORT/health" | grep -q '"status":"ok"'; then
    echo "$(date -Iseconds) restarting x402 server" >> "$S/watchdog.log"
    cd "$PROJECT" || exit 1
    # `python -m hermes_x402`, not `hermes_x402.server`: running the module file
    # directly would execute it a second time as `__main__`, and handlers
    # importing `hermes_x402.server` would see a different module object.
    PYTHONDONTWRITEBYTECODE=1 nohup "$PY" -B -m hermes_x402 \
        --host 127.0.0.1 --port "$PORT" --db "$DB" \
        --workers "${X402_WORKERS:-both}" >> "$LOG" 2>&1 &
    for _ in $(seq 1 25); do
        sleep 1
        curl -s -m 2 -o /dev/null "http://127.0.0.1:$PORT/health" && break
    done
fi

# 2. The tunnel, if the public URL is no longer answering.
#
# Match on the ssh binary and the remote-forward flag specifically. A bare
# `pgrep -f localhost.run` also matches the pgrep process itself (its own command
# line contains the pattern), which makes the check always succeed and silently
# skips the restart.
CURRENT=$(cat "$STATE" 2>/dev/null)
# Validate the body, not just the status code: localhost.run serves an HTML
# "no tunnel here" placeholder with HTTP 200 when the forward has gone away, so
# a curl exit-code check alone reports a dead tunnel as healthy.
if [ -z "$CURRENT" ] || ! curl -s -m 20 "$CURRENT/health" | grep -q '"status":"ok"'; then
    if ! pgrep -f "ssh .*-R 80:localhost:$PORT .*localhost\.run" >/dev/null 2>&1; then
        echo "$(date -Iseconds) restarting tunnel" >> "$S/watchdog.log"
        nohup ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            -o ServerAliveInterval=20 -o ServerAliveCountMax=20 \
            -o ExitOnForwardFailure=yes -o TCPKeepAlive=yes -n \
            -R 80:localhost:"$PORT" nokey@localhost.run > "$S/tunnel_live.log" 2>&1 &

        for _ in $(seq 1 20); do
            sleep 2
            NEW=$(tr -d '\000' < "$S/tunnel_live.log" 2>/dev/null | grep -o -E 'https://[a-z0-9-]+\.lhr\.life' | head -1)
            [ -n "$NEW" ] && break
        done
        if [ -n "${NEW:-}" ]; then
            echo "$NEW" > "$STATE"
            echo "$(date -Iseconds) new url $NEW" >> "$S/watchdog.log"
        fi
    fi
fi

# 3. Keep the tunnel warm: localhost.run times out on inactivity, and a real
#    request every cycle is what stops that from happening.
CURRENT=$(cat "$STATE" 2>/dev/null)
if [ -n "$CURRENT" ]; then
    if curl -s -m 20 "$CURRENT/health" | grep -q '"status":"ok"'; then
        echo "ok $(date -Iseconds) $CURRENT" >> "$S/watchdog.log"
    else
        echo "FAIL $(date -Iseconds) $CURRENT" >> "$S/watchdog.log"
    fi
fi
