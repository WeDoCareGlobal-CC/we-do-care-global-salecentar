#!/usr/bin/env bash
# End-to-end cross-module test against the running native staging stack.
# Verifies the full entitlement flow: central login -> grant -> module
# access -> revoke -> denial, against real module servers (not just the
# central server's internal endpoints).
set -u
BASE=http://127.0.0.1:3101
MS=http://127.0.0.1:3000   # menu-snap
ZB=http://127.0.0.1:3001   # zerobudget-ai
MF=http://127.0.0.1:3002   # muse-flow
PASS=0; FAIL=0
check(){
  if [ "$2" = "$3" ]; then echo "PASS | $1 (got $3)"; PASS=$((PASS+1));
  else echo "FAIL | $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi
}
H="content-type: application/json"
MSEC="$(printf 'm%.0s' {1..40})"; ASEC="$(printf 'a%.0s' {1..40})"

# 0. stack is up
code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$BASE/health")
check "0. central server health" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$MS/api/health")
check "0b. menu-snap health" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$ZB/api/health")
check "0c. zerobudget-ai health" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$MF/api/health")
check "0d. muse-flow health" "200" "$code"

# 1. create viewer via central admin
VEMAIL="e2e-$(date +%s)@example.org"
VPASS="E2e-Test-Password-2026!"
code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST "$BASE/admin/users" -H "$H" -H "authorization: Bearer $ASEC" \
  -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\",\"role\":\"viewer\"}")
check "1. admin creates viewer" "201" "$code"

# 2. login -> token
VJSON=$(curl -s -m 10 -X POST "$BASE/auth/login" -H "$H" -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\"}")
VTOK=$(echo "$VJSON" | python -c "import json,sys;print(json.load(sys.stdin).get('token',''))")
[ -n "$VTOK" ] && check "2. viewer login returns token" "ok" "ok" || check "2. viewer login returns token" "ok" "fail"

# 3. module server rejects unentitled user (default deny)
code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$MS/api/menus" -H "authorization: Bearer $VTOK")
check "3. menu-snap denies without entitlement (403)" "403" "$code"

# 4. grant entitlement centrally
VID=$(curl -s -m 10 "$BASE/portal/api/me" -H "authorization: Bearer $VTOK" | python -c "import json,sys;print(json.load(sys.stdin).get('user',{}).get('id',''))")
[ -n "$VID" ] && check "4. resolved viewer id" "ok" "ok" || check "4. resolved viewer id" "ok" "fail"
curl -s -o /dev/null -m 10 -X POST "$BASE/admin/entitlements" -H "$H" -H "authorization: Bearer $ASEC" \
  -d "{\"user_id\":\"$VID\",\"module_id\":\"menu-snap\",\"enabled\":true}"

# 5. module server now accepts (granted)
code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$MS/api/menus" -H "authorization: Bearer $VTOK")
check "5. menu-snap allows with entitlement (200)" "200" "$code"

# 6. isolation: zerobudget-ai still denied (no grant for it)
code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST "$ZB/api/generate-custom" -H "$H" -H "authorization: Bearer $VTOK" \
  -d '{"prompt":"test"}')
check "6. zerobudget-ai still denied (403)" "403" "$code"

# 7. revoke centrally -> module denies again
curl -s -o /dev/null -m 10 -X POST "$BASE/admin/entitlements" -H "$H" -H "authorization: Bearer $ASEC" \
  -d "{\"user_id\":\"$VID\",\"module_id\":\"menu-snap\",\"enabled\":false}"
code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$MS/api/menus" -H "authorization: Bearer $VTOK")
check "7. menu-snap denies after revoke (403)" "403" "$code"

# 8. invalid token rejected by module
code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$MS/api/menus" -H "authorization: Bearer invalidtokeninvalidtokeninvalidtoken12")
check "8. module rejects invalid token (401)" "401" "$code"

# 9. cleanup
curl -s -o /dev/null -m 10 -X DELETE "$BASE/admin/users/$VID" -H "authorization: Bearer $ASEC"
relogin=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST "$BASE/auth/login" -H "$H" -d "{\"email\":\"$VEMAIL\",\"password\":\"$VPASS\"}")
check "9. cleanup: deleted user cannot login (401)" "401" "$relogin"

echo ""
echo "RESULT: PASS=$PASS FAIL=$FAIL"
exit $FAIL
