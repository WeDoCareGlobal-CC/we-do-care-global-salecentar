#!/usr/bin/env bash
# Cross-module entitlement enforcement test against a running central server.
# Usage: BASE=http://127.0.0.1:32500 bash scripts/cross-module-entitlement-test.sh
# Requires the central server started with SALECENTAR_ALLOW_LEGACY_ADMIN=true
# and module secrets as configured below.
# Safety contract:
#   - Refuses non-localhost BASE unless ALLOW_REMOTE=1 is set explicitly.
#   - Refuses any target whose /health does not report mode=test
#     (SALECENTAR_TEST_ENV=1 on the server), so a production instance is
#     rejected even when reached over localhost.
#   - Verifies HTTP status codes for user creation and deletion.
#   - Confirms the throwaway user is actually removed at the end.
#   - Generates a unique random password per run; no fixed test credential
#     exists anywhere in this repository.
set -u
BASE="${BASE:-http://127.0.0.1:32500}"

# Refuse non-localhost targets unless the operator explicitly opts in.
case "$BASE" in
  http://127.0.0.1*|http://localhost*|https://127.0.0.1*|https://localhost*) ;;
  *)
    if [ "${ALLOW_REMOTE:-0}" != "1" ]; then
      echo "REFUSING: BASE=$BASE is not localhost. This script writes test data."
      echo "If you really intend to test a remote/staging host, re-run with ALLOW_REMOTE=1."
      exit 2
    fi
    echo "WARNING: running against non-localhost $BASE with ALLOW_REMOTE=1" >&2
    ;;
esac

# --- guard 2: target must identify itself as a test instance ---
HEALTH=$(curl -s -m 10 "$BASE/health" 2>/dev/null || echo '{}')
MODE=$(echo "$HEALTH" | python -c "import json,sys
try: print(json.load(sys.stdin).get('mode',''))
except Exception: print('')" 2>/dev/null || echo '')
if [ "$MODE" != "test" ]; then
  echo "REFUSING: $BASE/health reports mode='${MODE:-unknown}', not 'test'."
  echo "This script writes test data; start the server with SALECENTAR_TEST_ENV=1"
  echo "against an isolated test database before running it."
  exit 2
fi
PASS=0; FAIL=0
check(){
  if [ "$2" = "$3" ]; then echo "PASS | $1 (got $3)"; PASS=$((PASS+1));
  else echo "FAIL | $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi
}
H="content-type: application/json"
MSEC="${MSEC:-$(printf 'm%.0s' {1..40})}"; ZSEC="${ZSEC:-$(printf 'z%.0s' {1..40})}"
FSEC="${FSEC:-$(printf 'f%.0s' {1..40})}"; SSEC="${SSEC:-$(printf 's%.0s' {1..40})}"
HSEC="${HSEC:-$(printf 'h%.0s' {1..40})}"; ASEC="${ASEC:-$(printf 'a%.0s' {1..40})}"

# Provision a fresh viewer through the admin API, then log in.
VEMAIL="xmod-$(date +%s)-$$@example.org"
VPASS="Xmod-$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 16)-Test!"
VID=""
VTOK=""
cleanup(){
  if [ -n "$VTOK" ]; then
    curl -s -o /dev/null -m 10 -X POST "$BASE/auth/logout" -H "authorization: Bearer $VTOK" 2>/dev/null || true
  fi
  if [ -n "$VID" ]; then
    echo "cleanup: removing test user $VEMAIL"
    curl -s -o /dev/null -m 10 -X DELETE "$BASE/admin/users/$VID" -H "authorization: Bearer $ASEC" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# --- create user with explicit status verification ---
CREATE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 -X POST "$BASE/admin/users" -H "$H" -H "authorization: Bearer $ASEC" \
  -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\",\"role\":\"viewer\"}")
check "0. admin creates test viewer -> 201" "201" "$CREATE_CODE"
[ "$CREATE_CODE" = "201" ] || { echo "FATAL: user create failed (HTTP $CREATE_CODE)"; exit 1; }
VJSON=$(curl -s -m 15 -X POST "$BASE/auth/login" -H "$H" -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\"}")
VTOK=$(echo "$VJSON" | python -c "import json,sys;print(json.load(sys.stdin).get('token',''))")
[ -n "$VTOK" ] || { echo "FATAL: login failed"; exit 1; }
VID=$(curl -s -m 15 "$BASE/portal/api/me" -H "authorization: Bearer $VTOK" | python -c "import json,sys;print(json.load(sys.stdin).get('user',{}).get('id',''))")
echo "viewer_id=$VID"
[ -z "$VID" ] && { echo "FATAL: no viewer id"; exit 1; }

ENT(){ curl -s -X POST "$BASE/internal/auth/entitlement" -H "$H" -H "x-salecentar-module: $1" -H "x-salecentar-service-key: $2" -d "{\"user_id\":\"$VID\"}" | python -c 'import json,sys;print(str(json.load(sys.stdin).get("enabled","ERR")).lower())'; }
MODACCESS(){ curl -s "$BASE/portal/api/modules" -H "authorization: Bearer $VTOK" | python -c "import json,sys;print(str([m['access'] for m in json.load(sys.stdin)['modules'] if m['id']=='$1'][0]).lower())"; }
GRANT(){ curl -s -o /dev/null -X POST "$BASE/admin/entitlements" -H "$H" -H "authorization: Bearer $ASEC" -d "{\"user_id\":\"$VID\",\"module_id\":\"$1\",\"enabled\":$2}"; }

check "1. default deny: portal shows access=false" "false" "$(MODACCESS menu-snap)"
check "1b. default deny: entitlement endpoint false" "false" "$(ENT menu-snap $MSEC)"
GRANT menu-snap true
check "2. granted -> portal access=true" "true" "$(MODACCESS menu-snap)"
check "2b. granted -> entitlement endpoint true" "true" "$(ENT menu-snap $MSEC)"
check "3. isolation: zerobudget-ai still denied" "false" "$(ENT zerobudget-ai $ZSEC)"
check "3b. isolation: muse-flow still denied" "false" "$(ENT muse-flow $FSEC)"
GRANT menu-snap false
check "4. revoked -> portal access=false" "false" "$(MODACCESS menu-snap)"
check "4b. revoked -> entitlement endpoint false" "false" "$(ENT menu-snap $MSEC)"
GRANT menu-snap true
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/internal/auth/entitlement" -H "$H" -H "x-salecentar-module: menu-snap" -H "x-salecentar-service-key: totally-wrong-key-totally-wrong-key-wrong" -d "{\"user_id\":\"$VID\"}")
check "5. wrong service key -> 401" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/internal/auth/entitlement" -H "$H" -H "x-salecentar-module: zerobudget-ai" -H "x-salecentar-service-key: $MSEC" -d "{\"user_id\":\"$VID\"}")
check "6. cross-module secret misuse -> 401" "401" "$code"
check "7. hermes-x402 secret recognized" "false" "$(ENT hermes-x402 $HSEC)"
check "8. muse-flow secret recognized" "false" "$(ENT muse-flow $FSEC)"
check "9. speech-generator secret recognized" "false" "$(ENT speech-generator $SSEC)"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/internal/auth/introspect" -H "$H" -H "x-salecentar-module: menu-snap" -H "x-salecentar-service-key: $MSEC" -d '{"token":"invalidtokeninvalidtokeninvalidtoken12"}')
check "10. invalid token -> introspect 401" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/internal/auth/introspect" -H "$H" -H "x-salecentar-module: menu-snap" -H "x-salecentar-service-key: $MSEC" -d "{\"token\":\"$VTOK\"}")
check "11. valid token -> introspect 200" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin/overview" -H "authorization: Bearer $ASEC")
check "12. admin overview regression -> 200" "200" "$code"

# --- explicit teardown with status verification and removal confirmation ---
DEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 -X DELETE "$BASE/admin/users/$VID" -H "authorization: Bearer $ASEC")
check "13. admin deletes test viewer -> 200" "200" "$DEL_CODE"
# the account must be truly gone: a fresh login with the old credentials must fail
REL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 -X POST "$BASE/auth/login" -H "$H" -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\"}")
check "14. deleted user cannot log in again -> 401" "401" "$REL_CODE"

echo ""
echo "RESULT: PASS=$PASS FAIL=$FAIL"
exit $FAIL
