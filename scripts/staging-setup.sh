#!/usr/bin/env bash
# Staging setup and verification script
# Run this after configuring .env file

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== We Do Care Global SaleCentar - Staging Setup ==="
echo ""

# Check for .env file
if [[ ! -f .env ]]; then
    echo "ERROR: .env file not found. Copy .env.staging.example to .env and fill in all values."
    exit 1
fi

# Load environment
set -a
source .env
set +a

# Validate required secrets
echo "Validating required secrets..."
REQUIRED_SECRETS=(
    "POSTGRES_PASSWORD"
    "SALECENTAR_MENU_SNAP_SECRET"
    "SALECENTAR_ZERO_BUDGET_SECRET"
    "SALECENTAR_MUSE_FLOW_SECRET"
    "SALECENTAR_HERMES_SECRET"
    "SALECENTAR_SPEECH_GENERATOR_SECRET"
    "SALECENTAR_ADMIN_TOKEN"
    "SALECENTAR_BOOTSTRAP_SECRET"
    "GEMINI_API_KEY"
    "SPEECH_PROVIDER_API_KEY"
    "X402_PRIVATE_KEY"
    "HERMES_ADMIN_API_KEY"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    value="${!secret}"
    if [[ -z "$value" || "$value" == CHANGE_ME* ]]; then
        echo "  FAIL: $secret is not configured"
        exit 1
    fi
    if [[ ${#value} -lt 32 && "$secret" != "X402_PRIVATE_KEY" ]]; then
        echo "  FAIL: $secret must be at least 32 characters (current: ${#value})"
        exit 1
    fi
    if [[ "$secret" == "X402_PRIVATE_KEY" && ${#value} -ne 64 ]]; then
        echo "  FAIL: X402_PRIVATE_KEY must be 64 hex characters (current: ${#value})"
        exit 1
    fi
    echo "  OK: $secret"
done

# Check for distinct module secrets
echo ""
echo "Checking module secret uniqueness..."
SECRETS=(
    "$SALECENTAR_MENU_SNAP_SECRET"
    "$SALECENTAR_ZERO_BUDGET_SECRET"
    "$SALECENTAR_MUSE_FLOW_SECRET"
    "$SALECENTAR_HERMES_SECRET"
    "$SALECENTAR_SPEECH_GENERATOR_SECRET"
)

UNIQUE_COUNT=$(printf '%s\n' "${SECRETS[@]}" | sort -u | wc -l)
if [[ $UNIQUE_COUNT -ne 5 ]]; then
    echo "  FAIL: Module secrets must be distinct (found $UNIQUE_COUNT unique out of 5)"
    exit 1
fi
echo "  OK: All 5 module secrets are distinct"

# Check SSL certificates
echo ""
echo "Checking SSL certificates..."
if [[ ! -f nginx/ssl/salecentar.crt || ! -f nginx/ssl/salecentar.key ]]; then
    echo "  WARNING: SSL certificates not found. Generating self-signed certificates for staging..."
    mkdir -p nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/salecentar.key \
        -out nginx/ssl/salecentar.crt \
        -subj "/CN=salecentar.local" 2>/dev/null
    echo "  Generated self-signed certificates"
else
    echo "  OK: SSL certificates found"
fi

# Validate docker-compose.yml
echo ""
echo "Validating docker-compose.yml..."
if ! docker compose config >/dev/null 2>&1; then
    echo "  FAIL: docker-compose.yml is invalid"
    docker compose config
    exit 1
fi
echo "  OK: docker-compose.yml is valid"

echo ""
echo "=== Starting services ==="
docker compose up -d

echo ""
echo "=== Waiting for services to become healthy ==="
sleep 5

# Wait for postgres
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        echo "  PostgreSQL ready"
        break
    fi
    sleep 2
    if [[ $i -eq 30 ]]; then
        echo "  FAIL: PostgreSQL did not become ready"
        exit 1
    fi
done

# Wait for salecentar-integration
echo "Waiting for SaleCentar Integration..."
for i in {1..30}; do
    if curl -sf http://localhost:3101/health >/dev/null 2>&1; then
        echo "  SaleCentar Integration ready"
        break
    fi
    sleep 2
    if [[ $i -eq 30 ]]; then
        echo "  FAIL: SaleCentar Integration did not become ready"
        exit 1
    fi
done

# Wait for all other services
SERVICES=(
    "menu-snap:3000"
    "zerobudget-ai:3001"
    "muse-flow:3002"
    "speech-generator:3013"
    "hermes-x402:8000"
)

for service in "${SERVICES[@]}"; do
    name="${service%:*}"
    port="${service#*:}"
    echo "Waiting for $name..."
    for i in {1..30}; do
        if curl -sf "http://localhost:$port/health" >/dev/null 2>&1 || curl -sf "http://localhost:$port/api/health" >/dev/null 2>&1; then
            echo "  $name ready"
            break
        fi
        sleep 2
        if [[ $i -eq 30 ]]; then
            echo "  WARNING: $name did not become ready (may still be starting)"
        fi
    done
done

echo ""
echo "=== Running health checks ==="

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1 && echo "  OK: PostgreSQL connection" || echo "  FAIL: PostgreSQL connection"

# Test SaleCentar Integration endpoints
echo "Testing SaleCentar Integration endpoints..."
curl -sf http://localhost:3101/health >/dev/null && echo "  OK: /health" || echo "  FAIL: /health"
curl -sf http://localhost:3101/portal >/dev/null && echo "  OK: /portal" || echo "  FAIL: /portal"

# Test module health endpoints
for service in "${SERVICES[@]}"; do
    name="${service%:*}"
    port="${service#*:}"
    if curl -sf "http://localhost:$port/health" >/dev/null 2>&1 || curl -sf "http://localhost:$port/api/health" >/dev/null 2>&1; then
        echo "  OK: $name health endpoint"
    else
        echo "  FAIL: $name health endpoint"
    fi
done

# Test nginx
echo "Testing nginx..."
curl -sf http://localhost/health >/dev/null 2>&1 && echo "  OK: nginx health" || echo "  FAIL: nginx health"

echo ""
echo "=== Staging setup complete ==="
echo ""
echo "Service URLs (via nginx reverse proxy):"
echo "  SaleCentar Integration:  https://salecentar.local/integration/"
echo "  Staff Portal:            https://salecentar.local/portal"
echo "  Admin Control:           https://salecentar.local/control"
echo "  Menu Snap:               https://salecentar.local/menu-snap/"
echo "  ZeroBudget AI:           https://salecentar.local/zerobudget-ai/"
echo "  Muse-Flow:               https://salecentar.local/muse-flow/"
echo "  Speech Generator:        https://salecentar.local/speech/"
echo "  Hermes x402:             https://salecentar.local/hermes/"
echo ""
echo "Direct service ports (internal only):"
echo "  PostgreSQL:              localhost:5432"
echo "  SaleCentar Integration:  localhost:3101"
echo "  Menu Snap:               localhost:3000"
echo "  ZeroBudget AI:           localhost:3001"
echo "  Muse-Flow:               localhost:3002"
echo "  Speech Generator:        localhost:3013"
echo "  Hermes x402:             localhost:8000"
echo ""
echo "To stop: docker compose down"
echo "To view logs: docker compose logs -f [service-name]"