#!/usr/bin/env bash
# Cross-module entitlement enforcement test against a running central server.
# Usage: BASE=http://127.0.0.1:32500 bash scripts/cross-module-entitlement-test.sh
# Requires the central server started with SALECENTAR_ALLOW_LEGACY_ADMIN=true
# and module secrets as configured below.
#
# SAFETY: this script creates a throwaway viewer user in the target database.
# By default it only runs against localhost. Pointing it at a remote/production
# host requires the explicit ALLOW_REMOTE=1 override, and the created user is
# always deleted on exit (including on failure, via trap).
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
VEMAIL="xmod-$(date +%s)@example.org"
VPASS="CrossModule-Test-2026!"
VID=""
VTOK=""
cleanup(){
  if [ -n "$VTOK" ]; then
    curl -s -o /dev/null -X POST "$BASE/auth/logout" -H "authorization: Bearer $VTOK" 2>/dev/null || true
  fi
  if [ -n "$VID" ]; then
    echo "cleanup: removing test user $VEMAIL"
    curl -s -o /dev/null -X DELETE "$BASE/admin/users/$VID" -H "authorization: Bearer $ASEC" 2>/dev/null || true
  fi
}
trap cleanup EXIT

curl -s -o /dev/null -X POST "$BASE/admin/users" -H "$H" -H "authorization: Bearer $ASEC" \
  -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\",\"role\":\"viewer\"}" || { echo "FATAL: user create failed"; exit 1; }
VJSON=$(curl -s -X POST "$BASE/auth/login" -H "$H" -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\"}")
VTOK=$(echo "$VJSON" | python -c "import json,sys;print(json.load(sys.stdin)['token'])")
VID=$(curl -s "$BASE/portal/api/me" -H "authorization: Bearer $VTOK" | python -c "import json,sys;print(json.load(sys.stdin)['user']['id'])")
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

echo ""
echo "RESULT: PASS=$PASS FAIL=$FAIL"
exit $FAIL
