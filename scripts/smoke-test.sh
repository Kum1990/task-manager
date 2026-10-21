#!/bin/sh
# End-to-end smoke test through the Nginx reverse proxy.
# Usage: sh scripts/smoke-test.sh [base-url]   (default http://localhost:8080)
set -eu

BASE_URL="${1:-http://localhost:8080}"
SUFFIX="$(date +%s)"
BODY_FILE="/tmp/smoke_body.$$"

fail() {
  echo "FAIL: $1" >&2
  [ -f "$BODY_FILE" ] && cat "$BODY_FILE" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

# request METHOD PATH [JSON_BODY] [TOKEN] -> prints the HTTP status, saves the body to $BODY_FILE
request() {
  method="$1"
  path="$2"
  body="${3:-}"
  token="${4:-}"
  set -- -s -o "$BODY_FILE" -w '%{http_code}' -X "$method" -H 'Content-Type: application/json'
  if [ -n "$token" ]; then set -- "$@" -H "Authorization: Bearer $token"; fi
  if [ -n "$body" ]; then set -- "$@" -d "$body"; fi
  curl "$@" "$BASE_URL$path"
}

expect_status() {
  [ "$2" = "$1" ] || fail "$3 (expected HTTP $1, got $2)"
  pass "$3"
}

json_value() {
  sed -n "s/.*\"$1\":\"\{0,1\}\([^\",}]*\).*/\1/p" "$BODY_FILE" | head -n 1
}

echo "Waiting for $BASE_URL to become ready..."
i=0
until [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/ready")" = "200" ]; do
  i=$((i + 1))
  [ "$i" -ge 30 ] && fail "API did not become ready"
  sleep 2
done

expect_status 200 "$(request GET /)" "Frontend is served through the proxy"
expect_status 200 "$(request GET /api/health)" "API health endpoint"

expect_status 201 "$(request POST /api/auth/register \
  "{\"username\":\"alice_$SUFFIX\",\"email\":\"alice_$SUFFIX@example.com\",\"password\":\"Password123!\"}")" \
  "Register user A"
TOKEN_A="$(json_value token)"

expect_status 201 "$(request POST /api/auth/register \
  "{\"username\":\"bob_$SUFFIX\",\"email\":\"bob_$SUFFIX@example.com\",\"password\":\"Password123!\"}")" \
  "Register user B"
TOKEN_B="$(json_value token)"

expect_status 200 "$(request POST /api/auth/login \
  "{\"email\":\"alice_$SUFFIX@example.com\",\"password\":\"Password123!\"}")" "Login user A"

expect_status 401 "$(request GET /api/tasks)" "Tasks require authentication"

expect_status 201 "$(request POST /api/tasks '{"title":"Smoke test task","priority":"high"}' "$TOKEN_A")" \
  "User A creates a task"
TASK_ID="$(json_value id)"
[ -n "$TASK_ID" ] || fail "No task id returned"

expect_status 200 "$(request GET /api/tasks '' "$TOKEN_A")" "User A lists tasks"
grep -q "Smoke test task" "$BODY_FILE" || fail "User A cannot see their task"

expect_status 200 "$(request GET /api/tasks '' "$TOKEN_B")" "User B lists tasks"
grep -q '"tasks":\[\]' "$BODY_FILE" || fail "User B can see another user's tasks"

expect_status 404 "$(request GET "/api/tasks/$TASK_ID" '' "$TOKEN_B")" "User B cannot read user A's task"

expect_status 200 "$(request PATCH "/api/tasks/$TASK_ID" '{"status":"done"}' "$TOKEN_A")" \
  "User A updates the task"
grep -q '"status":"done"' "$BODY_FILE" || fail "Status was not updated"

expect_status 400 "$(request POST /api/tasks '{"title":""}' "$TOKEN_A")" "Invalid task is rejected"

expect_status 204 "$(request DELETE "/api/tasks/$TASK_ID" '' "$TOKEN_A")" "User A deletes the task"
expect_status 404 "$(request GET "/api/tasks/$TASK_ID" '' "$TOKEN_A")" "Deleted task is gone"

rm -f "$BODY_FILE"
echo "All smoke tests passed."
