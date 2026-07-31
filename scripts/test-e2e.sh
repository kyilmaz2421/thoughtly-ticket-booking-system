#!/usr/bin/env bash
# Run the full E2E suite against isolated Docker containers.
# Usage: ./scripts/test-e2e.sh [extra jest flags]
#
# Exit code mirrors the Jest exit code so CI can gate on it.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.test.yml"

cleanup() {
  echo ""
  echo "── Stopping test containers ──────────────────────────────────────────"
  docker compose -f "$COMPOSE_FILE" down --remove-orphans
}
trap cleanup EXIT

echo "── Starting test containers ──────────────────────────────────────────"
docker compose -f "$COMPOSE_FILE" up -d --wait

echo ""
echo "── Running E2E tests ─────────────────────────────────────────────────"
pnpm --filter backend test:e2e "$@"
