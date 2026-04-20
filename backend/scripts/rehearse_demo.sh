#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api}"
REHEARSALS="${REHEARSALS:-3}"

ADMIN_EMAIL="admin.demo@municipalite.tn"
ADMIN_PASS="Admin@123"
AGENT_EMAIL="agent.demo@municipalite.tn"
AGENT_PASS="Agent@123"
CITIZEN_EMAIL="citizen.demo@municipalite.tn"
CITIZEN_PASS="Citizen@123"

request_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local auth="${4:-}"

  local headers=(-H "Content-Type: application/json")
  if [[ -n "$auth" ]]; then
    headers+=(-H "Authorization: Bearer $auth")
  fi

  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$url" "${headers[@]}" -d "$body" -w "\n%{http_code}"
  else
    curl -sS -X "$method" "$url" "${headers[@]}" -w "\n%{http_code}"
  fi
}

extract_string_field() {
  local json="$1"
  local field="$2"
  printf "%s" "$json" | sed -n "s/.*\"${field}\":\"\([^\"]*\)\".*/\1/p"
}

extract_number_field() {
  local json="$1"
  local field="$2"
  printf "%s" "$json" | sed -n "s/.*\"${field}\":\([0-9][0-9]*\).*/\1/p"
}

expect_2xx() {
  local status="$1"
  local context="$2"
  if [[ ! "$status" =~ ^2 ]]; then
    echo "[FAIL] ${context} returned HTTP ${status}"
    exit 1
  fi
}

login_and_get_token() {
  local email="$1"
  local password="$2"

  local payload
  payload=$(printf '{"email":"%s","password":"%s"}' "$email" "$password")

  local response
  response=$(request_json "POST" "${BASE_URL}/auth/login" "$payload")

  local body status
  body=$(printf "%s" "$response" | sed '$d')
  status=$(printf "%s" "$response" | tail -n1)
  expect_2xx "$status" "login for ${email}"

  local token
  token=$(extract_string_field "$body" "token")
  if [[ -z "$token" ]]; then
    echo "[FAIL] Could not parse JWT token for ${email}"
    exit 1
  fi

  printf "%s" "$token"
}

for i in $(seq 1 "$REHEARSALS"); do
  echo "[INFO] Rehearsal ${i}/${REHEARSALS}"

  ADMIN_TOKEN=$(login_and_get_token "$ADMIN_EMAIL" "$ADMIN_PASS")
  AGENT_TOKEN=$(login_and_get_token "$AGENT_EMAIL" "$AGENT_PASS")
  CITIZEN_TOKEN=$(login_and_get_token "$CITIZEN_EMAIL" "$CITIZEN_PASS")

  categories_response=$(request_json "GET" "${BASE_URL}/categories")
  categories_body=$(printf "%s" "$categories_response" | sed '$d')
  categories_status=$(printf "%s" "$categories_response" | tail -n1)
  expect_2xx "$categories_status" "get categories"

  category_id=$(extract_number_field "$categories_body" "id")
  if [[ -z "$category_id" ]]; then
    echo "[FAIL] Could not parse category id"
    exit 1
  fi

  complaint_payload=$(printf '{"title":"Demo run %s","description":"Execution workflow rehearsal %s","priority":"Medium","categoryId":%s,"latitude":36.8065,"longitude":10.1815}' "$i" "$i" "$category_id")
  complaint_response=$(request_json "POST" "${BASE_URL}/complaints" "$complaint_payload" "$CITIZEN_TOKEN")
  complaint_body=$(printf "%s" "$complaint_response" | sed '$d')
  complaint_status=$(printf "%s" "$complaint_response" | tail -n1)
  expect_2xx "$complaint_status" "create complaint"

  complaint_id=$(extract_string_field "$complaint_body" "complaintId")
  if [[ -z "$complaint_id" ]]; then
    echo "[FAIL] Could not parse complaintId"
    exit 1
  fi

  agents_response=$(request_json "GET" "${BASE_URL}/users/agents" "" "$ADMIN_TOKEN")
  agents_body=$(printf "%s" "$agents_response" | sed '$d')
  agents_status=$(printf "%s" "$agents_response" | tail -n1)
  expect_2xx "$agents_status" "get agents"

  agent_id=$(extract_number_field "$agents_body" "id")
  if [[ -z "$agent_id" ]]; then
    echo "[FAIL] Could not parse agent id"
    exit 1
  fi

  assign_payload=$(printf '{"agentId":%s}' "$agent_id")
  assign_response=$(request_json "PUT" "${BASE_URL}/complaints/${complaint_id}/assign" "$assign_payload" "$ADMIN_TOKEN")
  assign_status=$(printf "%s" "$assign_response" | tail -n1)
  expect_2xx "$assign_status" "assign complaint"

  in_progress_response=$(request_json "PUT" "${BASE_URL}/complaints/${complaint_id}/status" '{"newStatus":"IN_PROGRESS"}' "$AGENT_TOKEN")
  in_progress_status=$(printf "%s" "$in_progress_response" | tail -n1)
  expect_2xx "$in_progress_status" "update status to IN_PROGRESS"

  resolved_response=$(request_json "PUT" "${BASE_URL}/complaints/${complaint_id}/status" '{"newStatus":"RESOLVED"}' "$AGENT_TOKEN")
  resolved_status=$(printf "%s" "$resolved_response" | tail -n1)
  expect_2xx "$resolved_status" "update status to RESOLVED"

  feedback_response=$(request_json "POST" "${BASE_URL}/complaints/${complaint_id}/feedback" '{"rating":5,"comment":"Great resolution"}' "$CITIZEN_TOKEN")
  feedback_status=$(printf "%s" "$feedback_response" | tail -n1)
  expect_2xx "$feedback_status" "submit feedback"

  my_response=$(request_json "GET" "${BASE_URL}/complaints/my" "" "$CITIZEN_TOKEN")
  my_body=$(printf "%s" "$my_response" | sed '$d')
  my_status=$(printf "%s" "$my_response" | tail -n1)
  expect_2xx "$my_status" "list citizen complaints"

  if ! printf "%s" "$my_body" | grep -q "${complaint_id}"; then
    echo "[FAIL] Complaint ${complaint_id} not found in citizen list"
    exit 1
  fi

  if ! printf "%s" "$my_body" | grep -q '"status":"CLOSED"'; then
    echo "[FAIL] Complaint ${complaint_id} did not reach CLOSED status"
    exit 1
  fi

  echo "[PASS] Rehearsal ${i} completed successfully"

done

echo "[DONE] ${REHEARSALS} rehearsal runs completed without technical errors"
